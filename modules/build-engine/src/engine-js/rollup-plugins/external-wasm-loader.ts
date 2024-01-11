import { rollup as Bundler } from '@ccbuild/bundler';
import { babel as Transformer } from '@ccbuild/transformer';
import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import ps from 'path';
import { brotliCompress as zlibBrotliCompress, brotliCompressSync, BrotliOptions } from 'zlib';
import { promisify } from 'util';

import babel = Transformer.core;
import pluginTransformSystemJSModule = Transformer.plugins.transformModulesSystemjs;

import rollup = Bundler.core;
import rpCjs = Bundler.plugins.commonjs;
import { createHash } from 'crypto';

const brotliCompress = promisify(zlibBrotliCompress);

const externalOrigin = 'external:';
function normalizePath (path: string): string {
    return path.replace(/\\/g, '/');
}

interface ISuffixReplaceConfig {
    [suffix: string]: string;
}

const suffixReplaceConfig: ISuffixReplaceConfig = {
    '.mem': '.mem.bin',
};

/**
 * emit asset and return the export statement
 */
async function emitAsset (context: rollup.PluginContext, filePath: string, options: externalWasmLoader.Options): Promise<string> {
    let basename = ps.basename(filePath);
    for (const suffixToReplace in suffixReplaceConfig) {
        const replacement: string =  suffixReplaceConfig[suffixToReplace];
        if (basename.endsWith(suffixToReplace)) {
            // some platforms doesn't support files with special suffix like '.mem', we replace it to '.bin'
            basename = basename.slice(0, -suffixToReplace.length) + replacement;
        }
    }

    const source = await fs.readFile(filePath);
    let referenceId: string;
    let hash: string;

    if (basename.endsWith('.wasm') && options.wasmCompressionMode === 'brotli') {
        const compressOptions: BrotliOptions = {};
        const compressedSource: Buffer = await brotliCompress(source, compressOptions);
        hash = createHash('sha256').update(compressedSource).digest('hex').slice(0, 8);
        const fileNamePrefix = basename.slice(0, -('.wasm'.length));
        referenceId = context.emitFile({
            type: 'asset',
            fileName: `assets/${fileNamePrefix}-${hash}.wasm.br`,
            source: compressedSource,
        });
    } else {
        hash = createHash('sha256').update(source).digest('hex').slice(0, 8);
        referenceId = context.emitFile({
            type: 'asset',
            name: basename,
            source,
        });
    }
    return `export default import.meta.ROLLUP_FILE_URL_${referenceId}; /* asset-hash:${hash} */`;
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

function shouldCullMeshoptModule (options: externalWasmLoader.Options, id: string): boolean {
    return options.cullMeshopt && id.includes('meshopt');
}

const loadConfig: ILoadConfig = {
    '.wasm': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.nativeCodeBundleMode === 'asmjs' || shouldCullMeshoptModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.js.mem': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.nativeCodeBundleMode === 'wasm' || shouldCullMeshoptModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.wasm.js': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.nativeCodeBundleMode === 'asmjs' || shouldCullMeshoptModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return false;
        },
        cullingContent: `export default function () {}`,
    },
    '.asm.js': {
        shouldCullModule (options: externalWasmLoader.Options, id: string): boolean {
            return options.nativeCodeBundleMode === 'wasm' || shouldCullMeshoptModule(options, id);
        },
        shouldEmitAsset (options: externalWasmLoader.Options, id: string): boolean {
            return false;
        },
        cullingContent: `export default function () {}`,
    },
};

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
        const id = normalizePath(ps.join(this._options.externalRoot, source.substring(externalOrigin.length)));
        return id;
    }

    private async _load (id: string): Promise<string> {
        for (const suffix in loadConfig) {
            if (id.endsWith(suffix)) {
                const config = loadConfig[suffix];
                if (config.shouldCullModule(this._options, id)) {
                    return config.cullingContent;
                } else if (config.shouldEmitAsset(this._options, id)) {
                    return this._emitAsset(id);
                } else {
                    return await this._transformSystemJs(id);
                }
            }
        }
        // fallback
        return await this._transformSystemJs(id);
    }

    // NOTE: we use rollup to transform CommonJS / ES Module to SystemJs.
    private async _transformSystemJs (id: string): Promise<string> {
        const systemJsModuleId = externalOrigin + ps.relative(this._options.externalRoot, id).replace(/\\/g, '/');
        const res = await rollup.rollup({
            input: id,
            plugins: [rpCjs()],
        });
        const output = await res.generate({
            format: 'system',
            name: systemJsModuleId,
        });
        await res.close();
        return output.output[0].code;
    }

    private _emitAsset (id: string): string {
        let basename = ps.basename(id);
        for (const suffixToReplace in suffixReplaceConfig) {
            const replacement: string =  suffixReplaceConfig[suffixToReplace];
            if (basename.endsWith(suffixToReplace)) {
                // some platforms doesn't support files with special suffix like '.mem', we replace it to '.bin'
                basename = basename.slice(0, -suffixToReplace.length) + replacement;
            }
        }
        let buffer = fs.readFileSync(id);
        const assetsDir = ps.join(this._options.outDir, 'assets');

        if (basename.endsWith('.wasm') && this._options.wasmCompressionMode === 'brotli') {
            const compressOptions: BrotliOptions = {};
            const compressedSource: Buffer = brotliCompressSync(buffer, compressOptions);
            const fileNamePrefix = basename.slice(0, -('.wasm'.length));
            basename = fileNamePrefix + '.wasm.br';
            buffer = compressedSource;
        }
    
        fs.outputFileSync(ps.join(assetsDir, basename), buffer);

        // output game.js
        const gameJs = ps.join(assetsDir, 'game.js');
        if (!fs.existsSync(gameJs)) {
            fs.outputFileSync(gameJs, `console.log('[CC Subpackage] wasm assets loaded');`, 'utf8');
        }
        return `export default 'assets/${basename}';`;
    }

    private _transform (id: string, code: string): string {
        if (code.startsWith('System.register')) {
            // NOTE: if it's already SystemJS module, we don't need to transform it again.
            return code;
        }
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

    async bundle (): Promise<string> {
        // transform all external wasm modules
        for (const externalWasmModule of this._options.externalWasmModules) {
            const id = this._resolveId(externalWasmModule);
            const code = await this._load(id);
            this._loadedChunkMap[id] = this._transform(id, code);
        }

        // bundle
        const result: string[] = [`console.log('[CC Subpackage] wasm chunks loaded');`];
        for (const id in this._loadedChunkMap) {
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

        async resolveId (this, source, importer): Promise<string | { id: string; external: true; } | null> {
            if (source.startsWith(externalOrigin)) {
                if (options.wasmSubpackage) {
                    externalWasmModules.push(source);
                    return {
                        id: source,
                        external: true,
                    };
                }
                return source;
            }
            return null;
        },

        async load (id): Promise<any> {
            if (id.startsWith(externalOrigin)) {
                const filePath = normalizePath(ps.join(options.externalRoot, id.substring(externalOrigin.length)));
                for (const suffix in loadConfig) {
                    if (filePath.endsWith(suffix)) {
                        const config = loadConfig[suffix];
                        if (config.shouldCullModule(options, id)) {
                            return config.cullingContent;
                        } else if (config.shouldEmitAsset(options, id)) {
                            return emitAsset(this, filePath, options);
                        } else {
                            return (await fs.readFile(filePath, 'utf8')).replace(/\r\n/g, '\n');
                        }
                    }
                }
                // some external module that doesn't obey the suffix specification, we return its content by default.
                return (await fs.readFile(filePath, 'utf8')).replace(/\r\n/g, '\n');
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
        }): string | undefined {
            switch (options.format) {
            case 'relative-from-chunk':
                return `'${relativePath}'`;
            case 'relative-from-out':
                return `'${fileName}'`;
            case 'runtime-resolved': default:
                return undefined; // return `new URL('${fileName}', import.meta.url).href`;
            }
        },

        async generateBundle (opts, bundles): Promise<void> {
            if (externalWasmModules.length !== 0) {
                const bundler = new ExternalWasmModuleBundler({
                    ...options,
                    externalWasmModules,
                    outDir: opts.dir!,
                });
                const code = await bundler.bundle();
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
         * The bundle mode of native code while building scripts.
         */
        nativeCodeBundleMode: 'wasm' | 'asmjs' | 'both';

        /**
         * Wasm compression mode, 'brotli' means to compress .wasm to .wasm.br.
         * @note Currently, only WeChat and ByteDance mini-game support to load '.wasm.br' file.
         */
        wasmCompressionMode?: 'brotli';

        /**
         * Whether cull meshopt module, including wasm and asm.js.
         */
        cullMeshopt: boolean;
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
export function pathToAssetRefURL (file: string): string {
    return `${assetPrefix}${pathToFileURL(file).pathname}`;
}

const assetPrefix = 'asset:';
