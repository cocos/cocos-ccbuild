/* eslint-disable no-inner-declarations */
import path from 'node:path';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { babelParse, getLang, isTs } from 'ast-kit';
import fg from 'fast-glob';
import type {
    Expression,
    PrivateName,
    Identifier,
    MemberExpression,
    TSEnumDeclaration,
    UnaryExpression,
    Statement,
} from '@babel/types';
import type { OptionsResolved } from './options';

/**
 * Represents the scan options for the enum.
 */
export type ScanOptions = Pick<
  OptionsResolved,
  'scanDir' | 'scanMode' | 'scanPattern'
>;

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
    readonly exported: boolean;
}

export interface IDefines {
    [id_key: `${string}.${string}`]: string | number;
}

/**
 * Represents the data of all enums.
 */
export interface EnumData {
    readonly declarations: {
        readonly [file: string]: ReadonlyArray<EnumDeclaration>;
    };
    readonly defines: IDefines;
}

type EnumKey<
  T extends string = string,
  U extends string = string
> = `${T}.${U}`;

type OnGetEnumValueCallback = (v: string | number) => void;

/**
 * Evaluates a JavaScript expression and returns the result.
 * @param exp - The expression to evaluate.
 * @returns The evaluated result.
 */
function evaluate(exp: string): string | number {
    return new Function(`return ${exp}`)();
}

function getEnumClassIdentifier(
    node: MemberExpression | Identifier
): Identifier | null {
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

function handleIdentifier(
    defines: IDefines,
    k: EnumKey,
    cb: OnGetEnumValueCallback, 
    wait: (enumFullKey: string, cb: OnGetEnumValueCallback) => void
): void {
    if ((k in defines)) {
        cb(defines[k]);
    } else {
        wait(k, (v: string | number): void => {
            cb(v);
        });
    }
}

function handleIdentifierForUnaryExpressionSync(
    defines: IDefines,
    k: EnumKey, 
    node: UnaryExpression
): string | number{
    if (!(k in defines)) {
        throw new Error(`${k} doesn't in defines`);
    }
    const exp = `${node.operator}${defines[k]}`;
    const value = evaluate(exp);
    return value;
}

async function handleOneTsEnum(info: {
    defines: IDefines,
    node: Statement,
    decl: TSEnumDeclaration,
    declarations: { [file: string]: EnumDeclaration[] },
    id: string,
    file: string,
    exported: boolean,
    wait: (enumFullKey: string, cb: OnGetEnumValueCallback) => void,
    resolve: (enumFullKey: string, v: string | number) => void,
}): Promise<void> {
    const { defines, node, decl, declarations, id, wait, resolve, file, exported } = info;

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
                // throw new Error(`name conflict for enum ${id} in ${file}`);
                console.warn(`name conflict for enum ${id} in ${file}`);
                return;
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
            if (init.type === 'StringLiteral' || init.type === 'NumericLiteral') {
                value = init.value;
            }
            // e.g. 1 << 2
            else if (init.type === 'BinaryExpression') {
                function resolveValue(node: Expression | PrivateName, cb: OnGetEnumValueCallback): void {
                    assert.ok(typeof node.start === 'number');
                    assert.ok(typeof node.end === 'number');

                    if (node.type === 'NumericLiteral' || node.type === 'StringLiteral') {
                        cb(node.value);
                    } else if (node.type === 'MemberExpression') {
                        const obj = getEnumClassIdentifier(node);
                        if (!obj) {
                            throw new Error(`Could not find object identifier`);
                        }

                        if (node.property.type === 'Identifier') {
                            handleIdentifier(defines, `${obj.name}.${node.property.name}`, cb, wait);
                        } else {
                            throw new Error(
                                `unhandled initializer type ${node.type} for ${fullKey} in ${file}`
                            );
                        }
                    } else if (node.type === 'Identifier') {
                        handleIdentifier(defines, `${id}.${node.name}`, cb, wait);
                    } else if (node.type === 'BinaryExpression') {
                        resolveValue(node.left, (left: string | number): void => {
                            resolveValue(node.right, (right: string | number): void => {
                                const exp = `${left}${node.operator}${right}`;
                                value = evaluate(exp);
                                cb(value);
                            });
                        });
                    } else if (node.type === 'UnaryExpression') {
                        if (node.argument.type === 'StringLiteral' || node.argument.type === 'NumericLiteral') {
                            const exp = `${node.operator}${node.argument.value}`;
                            value = evaluate(exp);
                        } else if (node.argument.type === 'Identifier') {
                            const k: EnumKey = `${id}.${node.argument.name}`;
                            value = handleIdentifierForUnaryExpressionSync(defines, k, node);
                        } else if (node.argument.type === 'MemberExpression') {
                            const newNode = node.argument;
                            const obj = getEnumClassIdentifier(newNode);
                            if (!obj) {
                                throw new Error(`Could not find object identifier`);
                            }
                            if (newNode.property.type === 'Identifier') {
                                const k: EnumKey = `${obj.name}.${newNode.property.name}`;
                                value = handleIdentifierForUnaryExpressionSync(defines, k, node);
                            } else {
                                throw new Error(
                                    `unhandled initializer type ${node.type} for ${fullKey} in ${file}`
                                );
                            }
                        } else if (node.argument.type === 'BinaryExpression') {
                            const argNode = node.argument;
                            resolveValue(argNode.left, (left: string | number): void => {
                                resolveValue(
                                    argNode.right, (right: string | number): void => {
                                        const exp = `${node.operator}(${left}${argNode.operator}${right})`;
                                        value = evaluate(exp);
                                        cb(value);
                                    }
                                );
                            });
                        } else {
                            throw new Error(
                                `unhandled UnaryExpression argument type ${node.argument.type} in ${file}`
                            );
                        }
                    } else {
                        throw new Error(
                            `unhandled BinaryExpression operand type ${node.type} in ${file}`
                        );
                    }
                }

                async function resolveValueAsync(node: Expression | PrivateName): Promise<string | number> {
                    return new Promise<string | number>((resolve, reject) => {
                        resolveValue(node, resolve);
                    });
                }

                const left = await resolveValueAsync(init.left);
                const right = await resolveValueAsync(init.right);
                const exp = `${left}${init.operator}${right}`;
                value = evaluate(exp);
            } else if (init.type === 'UnaryExpression') {
                if (init.argument.type === 'StringLiteral' || init.argument.type === 'NumericLiteral') {
                    const exp = `${init.operator}${init.argument.value}`;
                    value = evaluate(exp);
                } else if (init.argument.type === 'Identifier') {
                    const k: `${string}.${string}` = `${id}.${init.argument.name}`;
                    value = handleIdentifierForUnaryExpressionSync(defines, k, init);
                } else if (init.argument.type === 'MemberExpression') {
                    const newNode = init.argument;
                    const obj = getEnumClassIdentifier(newNode);
                    if (!obj) {
                        throw new Error(`Could not find object identifier`);
                    }
                    if (newNode.property.type === 'Identifier') {
                        const k: `${string}.${string}` = `${obj.name}.${newNode.property.name}`;
                        value = handleIdentifierForUnaryExpressionSync(defines, k, init);
                    } else {
                        throw new Error(
                            `unhandled initializer type ${init.type} for ${fullKey} in ${file}`
                        );
                    }
                } else {
                    throw new Error(
                        `unhandled UnaryExpression argument type ${init.argument.type} in ${file}`
                    );
                }
            } else if (init.type === 'Identifier') {
                // Value defined in the current enum
                const foundEnumElement = members.find((v) => v.name == init.name);
                if (foundEnumElement) {
                    value = foundEnumElement.value;
                } else {
                    throw new Error(
                        `unhandled Identifier type ${init.type} for ${fullKey} in ${file}`
                    );
                }
            } else if (init.type === 'MemberExpression') {
                const obj = getEnumClassIdentifier(init);
                if (!obj) {
                    throw new Error(`Could not find object identifier`);
                }

                async function handleIdentifierAsync(defines: IDefines, k: EnumKey): Promise<string | number> {
                    return new Promise<string | number>((resolve, reject) => {
                        handleIdentifier(defines, k, resolve, wait);
                    });
                }

                if (init.property.type === 'Identifier') {
                    const k: `${string}.${string}` = `${obj.name}.${init.property.name}`;
                    value = await handleIdentifierAsync(defines, k);
                } else {
                    throw new Error(
                        `unhandled initializer type ${init.type} for ${fullKey} in ${file}`
                    );
                }
            } else {
                throw new Error(
                    `unhandled initializer type ${init.type} for ${fullKey} in ${file}`
                );
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

        if (!(file in declarations)) {
            declarations[file] = [];
        }
        assert.ok(typeof node.start === 'number');
        assert.ok(typeof node.end === 'number');
        declarations[file].push({
            id,
            range: [node.start, node.end],
            members,
            exported,
        });
    }
}


async function handleOneTsFile(
    file: string,
    declarations: { [file: string]: EnumDeclaration[] },
    defines: IDefines,
    wait: (enumFullKey: string, cb: OnGetEnumValueCallback) => void,
    resolve: (enumFullKey: string, v: string | number) => void
): Promise<void> {
    const lang = getLang(file);
    if (!isTs(lang)) return;

    const content = readFileSync(file, 'utf-8');
    const ast = babelParse(content, lang);
    const enumIds: Set<string> = new Set();

    for (const node of ast.body) {
        let exported = false;
        let decl: TSEnumDeclaration | null = null;
        if (
            node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'TSEnumDeclaration'
        ) {
            decl = node.declaration;
            exported = true;
        } else if (node.type === 'TSEnumDeclaration') {
            decl = node;
        }

        if (!decl) continue;

        // Start to handle a TS enum
        const id = decl.id.name;
        if (enumIds.has(id)) {
            throw new Error(`not support declaration merging for enum ${id} in ${file}`);
        }
        enumIds.add(id);

        await handleOneTsEnum({
            defines,
            decl,
            declarations,
            node,
            id,
            file,
            exported,
            wait,
            resolve,
        });
    }
}

/**
 * Scans the specified directory for enums based on the provided options.
 * @param options - The scan options for the enum.
 * @returns The data of all enums found.
 */
export async function scanEnums(options: ScanOptions): Promise<EnumData> {
    const declarations: { [file: string]: EnumDeclaration[] } = Object.create(null);

    const defines: IDefines = Object.create(null);

    // 1. grep for files with exported enum
    const files = scanFiles(options);

    // 2. parse matched files to collect enum info
    const enumAsyncMap = new Map<string, Array<(v: string | number) => void>>();

    const handleFilePromiseArray: Promise<void>[] = [];

    for (const file of files) {
        handleFilePromiseArray.push(handleOneTsFile(
            file,
            declarations,
            defines,
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
        ));
    }

    await Promise.all(handleFilePromiseArray);

    assert.ok(enumAsyncMap.size === 0);

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
function scanFiles(options: ScanOptions): string[] {
    return fg
        .sync(options.scanPattern, {
            cwd: options.scanDir,
            ignore: ['**/*.jsb.ts'],
        })
        .map((file) => path.resolve(options.scanDir, file));
}
