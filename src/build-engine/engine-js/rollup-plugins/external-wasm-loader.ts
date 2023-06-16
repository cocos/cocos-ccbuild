import type * as rollup from 'rollup';
import { URL, fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import ps from 'path';

const externalOrigin = 'external:';
function normalizePath (path: string) {
    return path.replace(/\\/g, '/');
}

/**
 * emit asset and return the export statement
 */
async function emitAsset (context: rollup.PluginContext, filePath: string): Promise<string> {
    let basename = ps.basename(filePath)
    const suffixToReplace = '.mem';
    if (basename.endsWith(suffixToReplace)) {
        // some platforms doesn't support '.mem' files, we replace it to '.bin'
        basename = basename.slice(0, -suffixToReplace.length) + '.bin';
    }
    const referenceId = context.emitFile({
        type: 'asset',
        name: basename,
        // fileName: path,
        source: await fs.readFile(filePath),
    });

    return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
}

interface ILoadConfig {
    /**
     * The suffix of module specifier, we use the module suffix to determine whether the module is an asm or a wasm module.
     */
    [suffix: string]: {
        /**
         * Whether we should cull the module, this is useful when we need to take control of the package size.
         */
        shouldCullModule: (options: externalWasmLoader.Options, id: string) => boolean;
        /**
         * Whether we should emit the asset, this is useful when we compile module with suffix of '.wasm' or '.js.mem'.
         */
        shouldEmitAsset: (options: externalWasmLoader.Options, id: string) => boolean;
        /**
         * The module content to load when we the `shouldCullModule()` method returns true.
         */
        cullingContent: string;
    }
}

function shouldCullBulletWasmModule (options: externalWasmLoader.Options, id: string) {
    return options.forceBanningBulletWasm && id.includes('bullet');
}

function shouldCullAsmJsModule (options: externalWasmLoader.Options, id: string) {
    return options.wasmSupportMode !== 0 && options.cullAsmJsModule;
}

const loadConfig: ILoadConfig = {
    '.wasm': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.wasmSupportMode === 0 || shouldCullBulletWasmModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.js.mem': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.wasmSupportMode === 1 || shouldCullAsmJsModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.wasm.js': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.wasmSupportMode === 0 || shouldCullBulletWasmModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return false;
        },
        cullingContent: `export default function () {}`,
    },
    '.asm.js': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.wasmSupportMode === 1 || shouldCullAsmJsModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return false;
        },
        cullingContent: `export default function () {}`,
    },
}

/**
 * This plugin enable to load script or wasm with url based on 'external://' origin.
 */
export function externalWasmLoader (options: externalWasmLoader.Options): rollup.Plugin {
    return {
        name: '@cocos/ccbuild|external-loader',

        async resolveId (this, source, importer) {
            if (source.startsWith(externalOrigin)) {
                return source;
            }
            return null;
        },

        async load (id) {
            if (id.startsWith(externalOrigin)) {
                let filePath = normalizePath(ps.join(options.externalRoot, id.substring(externalOrigin.length)));
                for (const suffix in loadConfig) {
                    if (filePath.endsWith(suffix)) {
                        const config = loadConfig[suffix];
                        if (config.shouldCullModule(options, id)) {
                            return config.cullingContent;
                        } else if (config.shouldEmitAsset(options, id)) {
                            return emitAsset(this, filePath);
                        } else {
                            return await fs.readFile(filePath, 'utf8');
                        }
                    }
                }
                // some external module that doesn't obey the suffix specification, we return its content by default.
                return await fs.readFile(filePath, 'utf8');
            }
            return null;
        },

        // Generates the `import.meta.ROLLUP_FILE_URL_referenceId`.
        resolveFileUrl ({
            // > The path and file name of the emitted asset, relative to `output.dir` without a leading `./`.
            fileName,
            // > The path and file name of the emitted file,
            // > relative to the chunk the file is referenced from.
            // > This will path will contain no leading `./` but may contain a leading `../`.
            relativePath,
        }) {
            switch (options.format) {
            case 'relative-from-chunk':
                return `'${relativePath}'`;
            case 'relative-from-out':
                return `'${fileName}'`;
            case 'runtime-resolved': default:
                return undefined; // return `new URL('${fileName}', import.meta.url).href`;
            }
        },
    };
}

export declare namespace externalWasmLoader {
    export interface Options {
        /**
         * The root path of external repository
         */
        externalRoot: string,
        /**
         * The wasm support mode:
         * 0. not support
         * 1. support
         * 2. maybe support
         */
        wasmSupportMode: number;
        /**
         * Whether force banning to emit bullet wasm.
         */
        forceBanningBulletWasm: boolean;
        /**
         * Whether cull asm js module.
         */
        cullAsmJsModule: boolean;
        format?: Format;
    }

    /**
     * How to generate the reference to external assets:
     * - `'relative-from-out'`
     * Generate the path relative from `out` directory, does not contain the leading './'.
     *
     * - `'relative-from-chunk'`
     * Generate the path relative from the referencing output chunk.
     *
     * - `'dynamic'`(default)
     * Use runtime `URL` API to resolve the absolute URL.
     * This requires `URL` and `import.meta.url` to be valid.
     */
    export type Format =
        | 'relative-from-out'
        | 'relative-from-chunk'
        | 'runtime-resolved';
}

/**
 * Convert the file path to asset ref URL.
 * @param file File path in absolute.
 */
export function pathToAssetRefURL (file: string) {
    return `${assetPrefix}${pathToFileURL(file).pathname}`;
}

const assetPrefix = 'asset:';
