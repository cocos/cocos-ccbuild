/**
 * This entry file is for main unplugin.
 * @module
 */

// import { type UnpluginInstance, createUnplugin } from 'unplugin';
import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import ReplacePlugin from '@rollup/plugin-replace';
import { type Options, resolveOptions } from './core/options';
import { IDefines, scanEnums } from './core/enum';
import { rollup as Bundler } from '@ccbuild/bundler';
import rollup = Bundler.core;


type ConvertedObject = {
  [key: string]: string;
};

const convertNumberValuesToString = (obj: IDefines): ConvertedObject => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = JSON.stringify(value);
    return acc;
  }, {} as ConvertedObject);
};

/**
 * The main unplugin instance.
 */
export function rpInlineEnum(rawOptions: Options, meta?: any): rollup.Plugin[] {
  const options = resolveOptions(rawOptions);
  const filter = createFilter(options.include, options.exclude);

  const { declarations, defines } = scanEnums(options);

  const strDefines = convertNumberValuesToString(defines);

  const replacePlugin = ReplacePlugin(
    {
      include: options.include,
      exclude: options.exclude,
      values: strDefines,
      delimiters: ['([a-zA-Z0-9_]+\\.)*', '\\b(?!\\.)'],
    },
    // meta,
  );

  const name = 'unplugin-inline-enum';
  return [
    {
      name,
    //   enforce: options.enforce,

      async resolveId (this, source, importer): Promise<string | { id: string; external: true; } | null> {
        return filter(source) ? source : null;
      },

      transform(this, code, id): rollup.TransformResult {
        let s: MagicString | undefined;

        if (id in declarations) {
          s ||= new MagicString(code);
          for (const declaration of declarations[id]) {
            const {
              range: [start, end],
              id,
              members,
            } = declaration;
            s.update(
              start,
              end,
              `export const ${id} = {${members
                .flatMap(({ name, value }) => {
                  const forwardMapping = `${JSON.stringify(name)}: ${JSON.stringify(value)}`;
                  const reverseMapping = `${JSON.stringify(value.toString())}: ${JSON.stringify(name)}`;

                  // see https://www.typescriptlang.org/docs/handbook/enums.html#reverse-mappings
                  return typeof value === 'string'
                    ? [
                      forwardMapping,
                      // string enum members do not get a reverse mapping generated at all
                    ]
                    : [
                      forwardMapping,
                      // other enum members should support enum reverse mapping
                      // reverseMapping,
                    ];
                })
                .join(',\n')}}`,
            );
          }
        }

        if (s) {
          return {
            code: s.toString(),
            map: s.generateMap(),
          };
        }
      },
    },

    replacePlugin,
  ];
}
