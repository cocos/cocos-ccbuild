import path from 'node:path';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { babelParse, getLang, isTs } from 'ast-kit';
import fg from 'fast-glob';
import type { Expression, PrivateName, Identifier, MemberExpression } from '@babel/types';
import type { OptionsResolved } from './options';



/**
 * Represents the scan options for the enum.
 */
export type ScanOptions = Pick<
  OptionsResolved,
  'scanDir' | 'scanMode' | 'scanPattern'
>

/**
 * Represents a member of an enum.
 */
export interface EnumMember {
  readonly name: string;
  readonly value: string | number;
}

/**
 * Represents a declaration of an enum.
 */
export interface EnumDeclaration {
  readonly id: string;
  readonly range: readonly [start: number, end: number];
  readonly members: ReadonlyArray<EnumMember>;
}

export interface IDefines {
  [id_key: `${string}.${string}`]: string | number;
}

/**
 * Represents the data of all enums.
 */
export interface EnumData {
  readonly declarations: {
    readonly [file: string]: ReadonlyArray<EnumDeclaration>
  }
  readonly defines: IDefines;
}

/**
 * Evaluates a JavaScript expression and returns the result.
 * @param exp - The expression to evaluate.
 * @returns The evaluated result.
 */
function evaluate(exp: string): string | number {
  return new Function(`return ${exp}`)();
}

function getEnumClassIdentifier(node: MemberExpression | Identifier): Identifier | null {
  let obj = node;
  if (obj.type === 'MemberExpression') {
    if (obj.object.type === 'MemberExpression') {
      obj = obj.object.property as Identifier;
    } else if (obj.object.type === 'Identifier') {
      obj = obj.object;
    }
  }

  if (obj.type === 'Identifier') {
    return obj as Identifier;
  }
  return null;
}

function handleOneTsFile(
  file: string, 
  declarations: { [file: string]: EnumDeclaration[] }, 
  defines: IDefines, 
  wait: (enumFullKey: string, cb: (v: string | number) => void) => void,
  resolve: (enumFullKey: string, v: string | number) => void,
): void {
  const lang = getLang(file);
  if (!isTs(lang)) return;
  
  const content = readFileSync(file, 'utf-8');

  const ast = babelParse(content, lang);

  const enumIds: Set<string> = new Set();
  for (const node of ast.body) {
    if (
      node.type === 'ExportNamedDeclaration' &&
      node.declaration &&
      node.declaration.type === 'TSEnumDeclaration'
    ) {
      const decl = node.declaration;
      const id = decl.id.name;
      if (enumIds.has(id)) {
        throw new Error(
          `not support declaration merging for enum ${id} in ${file}`,
        );
      }
      enumIds.add(id);

      let lastInitialized: string | number | undefined;
      const members: Array<EnumMember> = [];

      for (const e of decl.members) {
        const key = e.id.type === 'Identifier' ? e.id.name : e.id.value;
        const fullKey = `${id}.${key}` as const;
        const saveValue = (value: string | number): void => {
          // We need allow same name enum in different file.
          // For example: enum ErrorCodes exist in both @vue/compiler-core and @vue/runtime-core
          // But not allow `ErrorCodes.__EXTEND_POINT__` appear in two same name enum
          if (fullKey in defines) {
            throw new Error(`name conflict for enum ${id} in ${file}`);
          }
          members.push({
            name: key,
            value,
          });
          defines[fullKey] = value;
          resolve(fullKey, value);
        };
        const init = e.initializer;
        if (init) {
          let value: string | number;
          if (
            init.type === 'StringLiteral' ||
            init.type === 'NumericLiteral'
          ) {
            value = init.value;
          }
          // e.g. 1 << 2
          else if (init.type === 'BinaryExpression') {
            const resolveValue = (node: Expression | PrivateName, cb: (v: string | number) => void): void => {
              assert.ok(typeof node.start === 'number');
              assert.ok(typeof node.end === 'number');
              if (
                node.type === 'NumericLiteral' ||
                node.type === 'StringLiteral'
              ) {
                cb(node.value);
              } else if (node.type === 'MemberExpression') {
                // const exp = content.slice(
                //   node.start,
                //   node.end,
                // ) as `${string}.${string}`;
                // if (!(exp in defines)) {
                //   throw new Error(
                //     `unhandled enum initialization expression ${exp} in ${file}`,
                //   );
                // }
                // return defines[exp];

                const obj = getEnumClassIdentifier(node);
                if (!obj) {
                  throw new Error(`Could not find object identifier`);
                }

                if (node.property.type === 'Identifier') {
                  const k: `${string}.${string}` = `${obj.name}.${node.property.name}`;
                  if (Object.prototype.hasOwnProperty.call(defines, k)) {
                    // return defines[k];
                    cb(defines[k]);
                  } else {
                    // throw new Error(`Could not find ${k} in defines`);
                    wait(k, (v: string | number): void => {
                      cb(v);
                    });
                  }
                } else {
                  throw new Error(`unhandled initializer type ${node.type} for ${fullKey} in ${file}`);
                } 

              } else if (node.type === 'Identifier') {
                const k: `${string}.${string}` = `${id}.${node.name}`;
                // if (!(k in defines)) {
                //   throw new Error(`${k} doesn't in defines`);
                // }
                // cb(defines[k]);

                if (Object.prototype.hasOwnProperty.call(defines, k)) {
                  cb(defines[k]);
                } else {
                  // throw new Error(`Could not find ${k} in defines`);
                  wait(k, (v: string | number): void => {
                    cb(v);
                  });
                }
              } else if (node.type === 'BinaryExpression') {
                resolveValue(node.left, (left: string | number): void => {
                  resolveValue(node.right, (right: string | number): void => {
                    const exp = `${left}${node.operator}${right}`;
                    value = evaluate(exp);
                    cb(value);
                  });
                });
              } else if (node.type === 'UnaryExpression') {
                if (
                  node.argument.type === 'StringLiteral' ||
                  node.argument.type === 'NumericLiteral'
                ) {
                  const exp = `${node.operator}${node.argument.value}`;
                  value = evaluate(exp);
                } else if (node.argument.type === 'Identifier') {
                  const k: `${string}.${string}` = `${id}.${node.argument.name}`;
                    if (!(k in defines)) {
                      throw new Error(`${k} doesn't in defines`);
                    }
                    const exp = `${node.operator}${defines[k]}`;
                    value = evaluate(exp);
                } else if (node.argument.type === 'MemberExpression') {
                  const newNode = node.argument;
                  const obj = getEnumClassIdentifier(newNode);
                  if (!obj) {
                    throw new Error(`Could not find object identifier`);
                  }
                  if (newNode.property.type === 'Identifier') {
                    const k: `${string}.${string}` = `${obj.name}.${newNode.property.name}`;
                    if (k in defines) {
                      const exp = `${node.operator}${defines[k]}`;
                      value = evaluate(exp);
                    } else {
                      throw new Error(`Could not find ${k} in defines`);
                    }
                  } else {
                    throw new Error(`unhandled initializer type ${node.type} for ${fullKey} in ${file}`);
                  } 
                } else if (node.argument.type === 'BinaryExpression') {
                  const argNode = node.argument;
                  resolveValue(argNode.left, (left: string | number): void => {
                    resolveValue(argNode.right, (right: string | number): void => {
                      const exp = `${left}${argNode.operator}${right}`;
                      value = evaluate(exp);
                      cb(value);
                    });
                  });
                } else {
                  throw new Error(
                    `unhandled UnaryExpression argument type ${node.argument.type} in ${file}`,
                  );
                }
              } else {
                throw new Error(
                  `unhandled BinaryExpression operand type ${node.type} in ${file}`,
                );
              }
            };

            resolveValue(init.left, (left: string | number): void => {
              resolveValue(init.right, (right: string | number): void => {
                const exp = `${left}${init.operator}${right}`;
                value = evaluate(exp);
                saveValue(value);
              });
            });
            // const exp = `${resolveValue(init.left)}${
            //   init.operator
            // }${resolveValue(init.right)}`;
            // value = evaluate(exp);
            continue;
          } else if (init.type === 'UnaryExpression') {
            if (
              init.argument.type === 'StringLiteral' ||
              init.argument.type === 'NumericLiteral'
            ) {
              const exp = `${init.operator}${init.argument.value}`;
              value = evaluate(exp);
            } else if (init.argument.type === 'Identifier') {
              const k: `${string}.${string}` = `${id}.${init.argument.name}`;
                if (!(k in defines)) {
                  throw new Error(`${k} doesn't in defines`);
                }
                const exp = `${init.operator}${defines[k]}`;
                value = evaluate(exp);
            } else if (init.argument.type === 'MemberExpression') {
              const newNode = init.argument;
              const obj = getEnumClassIdentifier(newNode);
              if (!obj) {
                throw new Error(`Could not find object identifier`);
              }
              if (newNode.property.type === 'Identifier') {
                const k: `${string}.${string}` = `${obj.name}.${newNode.property.name}`;
                if (k in defines) {
                  const exp = `${init.operator}${defines[k]}`;
                  value = evaluate(exp);
                } else {
                  throw new Error(`Could not find ${k} in defines`);
                }
              } else {
                throw new Error(`unhandled initializer type ${init.type} for ${fullKey} in ${file}`);
              } 
            } else {
              throw new Error(
                `unhandled UnaryExpression argument type ${init.argument.type} in ${file}`,
              );
            }
          } else if (init.type === 'Identifier' ){
            const foundEnumElement = members.find((v) => v.name == init.name);
            if (foundEnumElement) {
              value = foundEnumElement.value;
            } else {
              
              throw new Error(`unhandled Identifier type ${init.type} for ${fullKey} in ${file}`,);
            }
            
          } else if (init.type === 'MemberExpression') {
            const obj = getEnumClassIdentifier(init);
            if (!obj) {
              throw new Error(`Could not find object identifier`);
            }
            if (init.property.type === 'Identifier') {
              const k: `${string}.${string}` = `${obj.name}.${init.property.name}`;
              if (Object.prototype.hasOwnProperty.call(defines, k)) {
                value = defines[k];
              } else {
                // throw new Error(`Could not find ${k} in defines`);
                wait(k, (v: string | number): void => {
                  value = v;
                  saveValue(value);
                });
                continue;
              }
            } else {
              throw new Error(`unhandled initializer type ${init.type} for ${fullKey} in ${file}`);
            } 
          } else {
            throw new Error(`unhandled initializer type ${init.type} for ${fullKey} in ${file}`);
          }
          lastInitialized = value;
          saveValue(lastInitialized);
        } else if (lastInitialized === undefined) {
          // first initialized
          lastInitialized = 0;
          saveValue(lastInitialized);
        } else if (typeof lastInitialized === 'number') {
          lastInitialized++;
          saveValue(lastInitialized);
        } else {
          // should not happen
          throw new TypeError(`wrong enum initialization sequence in ${file}`);
        }
      }

      if (!(file in declarations)) {
        declarations[file] = [];
      }
      assert.ok(typeof node.start === 'number');
      assert.ok(typeof node.end === 'number');
      declarations[file].push({
        id,
        range: [node.start, node.end],
        members,
      });
    }
  }
}

/**
 * Scans the specified directory for enums based on the provided options.
 * @param options - The scan options for the enum.
 * @returns The data of all enums found.
 */
export function scanEnums(options: ScanOptions): EnumData {
  const declarations: { [file: string]: EnumDeclaration[] } = Object.create(null);

  const defines: IDefines = Object.create(null);

  // 1. grep for files with exported enum
  const files = scanFiles(options);

  // 2. parse matched files to collect enum info
  const enumAsyncMap = new Map<string, Array<(v: string | number) => void>>();
  for (const file of files) {
    handleOneTsFile(file, declarations, defines, 
      (enumFullKey: string, cb: (v: string | number) => void): void => {
        let callbacks = enumAsyncMap.get(enumFullKey);
        if (callbacks == null) {
          callbacks = [];
          enumAsyncMap.set(enumFullKey, callbacks);
        }
        callbacks.push(cb);
      },
      (enumFullKey: string, v: string | number): void => {
        const callbacks = enumAsyncMap.get(enumFullKey);
        if (callbacks) {
          for (const cb of callbacks) {
            cb(v);
          }

          enumAsyncMap.delete(enumFullKey);
        }
      }
    );
  }

  // assert.ok(enumAsyncMap.size === 0);

  const enumData: EnumData = {
    declarations,
    defines,
  };
  return enumData;
}

/**
 * Scans the specified directory for files based on the provided options.
 * @param options - The scan options for the files.
 * @returns The list of files found.
 */
export function scanFiles(options: ScanOptions): string[] {
    return fg
      .sync(options.scanPattern, {
        cwd: options.scanDir,
        ignore: ['**/*.jsb.ts'],
      })
      .map((file) => path.resolve(options.scanDir, file));
}
