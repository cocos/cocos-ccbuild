// Inspired by https://github.com/unplugin/unplugin-inline-enum

import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import ReplacePlugin from '@rollup/plugin-replace';
import { type Options, resolveOptions } from './core/options';
import { IDefines, scanEnums } from './core/enum';
import { rollup as Bundler } from '@ccbuild/bundler';
import { ps as pathUtils } from '@ccbuild/utils';
import rollup = Bundler.core;


type ConvertedObject = {
    [key: string]: string;
};

const convertNumberValuesToString = (obj: IDefines): ConvertedObject => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] = JSON.stringify(value);// + ` /* _.${key} */ `;
        return acc;
    }, {} as ConvertedObject);
};

/**
 * The main unplugin instance.
 */
export async function rpInlineEnum(rawOptions: Options, meta?: any): Promise<rollup.Plugin[]> {
    const options = resolveOptions(rawOptions);
    const filter = createFilter(options.include, options.exclude);

    const { declarations, defines } = await scanEnums(options);

    const strDefines = convertNumberValuesToString(defines);

    strDefines['Float32Array.BYTES_PER_ELEMENT'] =  '4';
    strDefines['Float64Array.BYTES_PER_ELEMENT'] =  '8';
  
    strDefines['Uint8Array.BYTES_PER_ELEMENT'] =  '1';
    strDefines['Uint8ClampedArray.BYTES_PER_ELEMENT'] = '1';
    strDefines['Uint16Array.BYTES_PER_ELEMENT'] =  '2';
    strDefines['Uint32Array.BYTES_PER_ELEMENT'] =  '4';
    strDefines['Int8Array.BYTES_PER_ELEMENT'] =  '1';
    strDefines['Int16Array.BYTES_PER_ELEMENT'] =  '2';
    strDefines['Int32Array.BYTES_PER_ELEMENT'] =  '4';


    const replacePlugin = ReplacePlugin(
        {
            include: options.include,
            exclude: options.exclude,
            values: strDefines,
            delimiters: ['(?<!\\.)\\b', '\\b(?!\\.)'],
            preventAssignment: true,
        },
    // meta,
    );

    const name = 'cc-inline-enum';

    const moduleOverrides = options.moduleOverrides;
    for (const k in moduleOverrides) {
        const v = moduleOverrides[k];
        console.info(`[${name}], overrides[${k}]=${v}`);
    }
    return [
        {
            name,
            //   enforce: options.enforce,

            async resolveId (this, source, importer): Promise<string | { id: string; external: true; } | null> {
                return filter(source) ? source : null;
            },

            transform(this, code: string, key: string): rollup.TransformResult {
                // Don't transform a module that is overrode
                const moduleId = pathUtils.makePathEqualityKey(key);
                console.info(`[${name}], transform: ${moduleId}`);
                if (options.moduleOverrides && (moduleId in options.moduleOverrides)) {
                    return;
                }

                let s: MagicString | undefined;

                if (moduleId in declarations) {
                    s ||= new MagicString(code);
                    for (const declaration of declarations[moduleId]) {
                        const {
                            range: [start, end],
                            id,
                            members,
                            exported,
                        } = declaration;

                        const prefix = exported ? 'export' : '';

                        s.update(
                            start,
                            end,
                            `${prefix} const ${id} = {${members
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
