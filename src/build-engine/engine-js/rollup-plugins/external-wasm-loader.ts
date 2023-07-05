import type * as rollup from 'rollup';
import { URL, fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import ps from 'path';
import * as babel from '@babel/core';
// @ts-ignore
import pluginTransformSystemJSModule from '@babel/plugin-transform-modules-systemjs';

const externalOrigin = 'external:';
function normalizePath (path: string) {
    return path.replace(/\\/g, '/');
}

interface ISuffixReplaceConfig {
    [suffix: string]: string;
}

const suffixReplaceConfig: ISuffixReplaceConfig = {
    '.mem': '.mem.bin',
    '.wasm.fallback': '.wasm.fallback.bin',
};

/**
 * emit asset and return the export statement
 */
async function emitAsset (context: rollup.PluginContext, filePath: string): Promise<string> {
    let basename = ps.basename(filePath)
    for (let suffixToReplace in suffixReplaceConfig) {
        const replacement: string =  suffixReplaceConfig[suffixToReplace];
        if (basename.endsWith(suffixToReplace)) {
            // some platforms doesn't support files with special suffix like '.mem', we replace it to '.bin'
            basename = basename.slice(0, -suffixToReplace.length) + replacement;
        }
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
            return (options.wasmSupportMode === 1 && !shouldCullBulletWasmModule(options, id)) || shouldCullAsmJsModule(options, id);
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
            return (options.wasmSupportMode === 1 && !shouldCullBulletWasmModule(options, id)) || shouldCullAsmJsModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return false;
        },
        cullingContent: `export default function () {}`,
    },
    '.wasm.fallback': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return loadConfig['.wasm'].shouldCullModule(options, id) || !options.wasmFallback;
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.wasm.fallback.js': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return loadConfig['.wasm.js'].shouldCullModule(options, id) || !options.wasmFallback;
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return false;
        },
        cullingContent: `export default function () {}`,
    },
}

declare namespace ExternalWasmModuleBundler {
    interface Options extends externalWasmLoader.Options {
        externalWasmModules: string[];
        outDir: string;
    }
}

/**
 * This is a module bundler for minigame subpacakge.
 * We need an entry script called 'game.js' for each subpackage.
 */
class ExternalWasmModuleBundler {
    private _options!: ExternalWasmModuleBundler.Options;
    private _loadedChunkMap: Record<string, string> = {};  // id to code

    constructor (options: ExternalWasmModuleBundler.Options) {
        this._options = options;
    }

    private _resolveId (source: string): string {
        let id = normalizePath(ps.join(this._options.externalRoot, source.substring(externalOrigin.length)));
        return id;
    }

    private _load (id: string): string {
        for (const suffix in loadConfig) {
            if (id.endsWith(suffix)) {
                const config = loadConfig[suffix];
                if (config.shouldCullModule(this._options, id)) {
                    return config.cullingContent;
                } else if (config.shouldEmitAsset(this._options, id)) {
                    return this._emitAsset(id);
                } else {
                    return fs.readFileSync(id, 'utf8');
                }
            }
        }
        // fallback
        return fs.readFileSync(id, 'utf8');
    }

    private _emitAsset (id: string): string {
        let basename = ps.basename(id);
        for (let suffixToReplace in suffixReplaceConfig) {
            const replacement: string =  suffixReplaceConfig[suffixToReplace];
            if (basename.endsWith(suffixToReplace)) {
                // some platforms doesn't support files with special suffix like '.mem', we replace it to '.bin'
                basename = basename.slice(0, -suffixToReplace.length) + replacement;
            }
        }
        const buffer = fs.readFileSync(id);
        const assetsDir = ps.join(this._options.outDir, 'assets');
        fs.outputFileSync(ps.join(assetsDir, basename), buffer);
        // output game.js
        const gameJs = ps.join(assetsDir, 'game.js');
        if (!fs.existsSync(gameJs)) {
            fs.outputFileSync(gameJs, `console.log('[CC Subpackage] wasm assets loaded');`, 'utf8');
        }
        return `export default 'assets/${basename}';`;
    }

    private _transform (id: string, code: string): string {
        const systemJsModuleId = externalOrigin + ps.relative(this._options.externalRoot, id).replace(/\\/g, '/');
        const res = babel.transformSync(code, {
            compact: true,  // remove error log
            plugins: [
                [pluginTransformSystemJSModule, {
                    moduleId: systemJsModuleId,
                }],
            ],
        });
        code = res!.code!;
        return code;
    }

    bundle (): string {
        // transform all external wasm modules
        for (const externalWasmModule of this._options.externalWasmModules) {
            const id = this._resolveId(externalWasmModule);
            const code = this._load(id);
            this._loadedChunkMap[id] = this._transform(id, code);
        }

        // bundle
        let result: string[] = [`console.log('[CC Subpackage] wasm chunks loaded');`];
        for (let id in this._loadedChunkMap) {
            const code = this._loadedChunkMap[id];
            result.push(code);
        }
        return result.join('\n');
    }
}

/**
 * This plugin enable to load script or wasm with url based on 'external://' origin.
 */
export function externalWasmLoader (options: externalWasmLoader.Options): rollup.Plugin {
    const externalWasmModules: string[] = [];
    return {
        name: '@cocos/ccbuild|external-loader',

        async resolveId (this, source, importer) {
            if (source.startsWith(externalOrigin)) {
                if (options.wasmSubpackage) {
                    externalWasmModules.push(source);
                    return {
                        id: source,
                        external: true,
                    }
                }
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

        generateBundle (opts, bundles) {
            if (externalWasmModules.length !== 0) {
                const bundler = new ExternalWasmModuleBundler({
                    ...options,
                    externalWasmModules,
                    outDir: opts.dir!,
                });
                const code = bundler.bundle();
                fs.outputFileSync(ps.join(opts.dir!, 'chunks/game.js'), code, 'utf8');
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
         * Whether need a fallback of wasm.
         * If true, we need to build a wasm fallback module for the compatibility of wasm files compiled by different version of emscripten.
         */
        wasmFallback: boolean;
        /**
         * Whether force banning to emit bullet wasm.
         */
        forceBanningBulletWasm: boolean;
        /**
         * Whether cull asm js module.
         */
        cullAsmJsModule: boolean;
        /**
         * Build external wasm module as minigame subpackage.
         * This feature is for minigame platforms.
         */
        wasmSubpackage: boolean;
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
