import * as fs from 'fs-extra';
import { posix as ps } from 'path';
import { createHash } from 'crypto';
import { ITsEnginePlugin } from './interface';
import { formatPath } from '@ccbuild/utils';
import { rollup as Bundler } from '@ccbuild/bundler';

import rollup = Bundler.core;
const rpCjs = Bundler.plugins.commonjs;

const externalOrigin = 'external:';
function resolveExternalProtocol (options: externalWasmLoaderFactory.Options, source: string): string {
    return ps.join(options.engineRoot, source.replace(externalOrigin, 'native/external/'));
}

function emitAsset (options: externalWasmLoaderFactory.Options, id: string): string {
    if (options.outDir) {
        const buffer = fs.readFileSync(id);
        const base = formatPath(ps.join('assets', ps.basename(id)));
        const outputFile = ps.join(options.outDir, base);
        fs.outputFileSync(outputFile, buffer);
        return `export default '${base}';`;
    }
    return `throw new Error('Failed to build wasm assets');`;
}

interface ILoadConfig {
    /**
     * The suffix of module specifier, we use the module suffix to determine whether the module is an asm or a wasm module.
     */
    [suffix: string]: {
        /**
         * Whether we should cull the module, this is useful when we need to take control of the package size.
         */
        shouldCullModule: (options: externalWasmLoaderFactory.Options, id: string) => boolean;
        /**
         * Whether we should emit the asset, this is useful when we compile module with suffix of '.wasm' or '.js.mem'.
         */
        shouldEmitAsset: (options: externalWasmLoaderFactory.Options, id: string) => boolean;
        /**
         * The module content to load when we the `shouldCullModule()` method returns true.
         */
        cullingContent: string;
    }
}

function shouldCullMeshoptModule (options: externalWasmLoaderFactory.Options, id: string): boolean {
    return options.cullMeshopt && id.includes('meshopt');
}

const loadConfig: ILoadConfig = {
    '.wasm': {
        shouldCullModule (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return true;  // OH platform doesn't support wasm
        },
        shouldEmitAsset (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.js.mem': {
        shouldCullModule (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return shouldCullMeshoptModule(options, id);  // we can only use asm.js on OH platform
        },
        shouldEmitAsset (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return !this.shouldCullModule(options, id);
        },
        cullingContent: `export default '';`,
    },
    '.wasm.js': {
        shouldCullModule (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return true;  // OH platform doesn't support wasm
        },
        shouldEmitAsset (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return false;
        },
        cullingContent: `let $: any;export default $;`,
    },
    '.asm.js': {
        shouldCullModule (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return shouldCullMeshoptModule(options, id);  // we can only use asm.js on OH platform
        },
        shouldEmitAsset (options: externalWasmLoaderFactory.Options, id: string): boolean {
            return false;
        },
        cullingContent: `let $: any;export default $;`,
    },
};

// NOTE: we use rollup to transform CommonJS to ES Module.
async function _transformESM (id: string): Promise<string> {
    const res = await rollup.rollup({
        input: id,
        plugins: [rpCjs()],
    });
    const output = await res.generate({
        format: 'esm',
    });
    await res.close();
    return '// @ts-nocheck\n' + output.output[0].code;
}

export function externalWasmLoaderFactory (options: externalWasmLoaderFactory.Options): ITsEnginePlugin {
    const id2Source: Record<string, string> = {};
    const source2Id: Record<string, string> = {};
    const externalWasmLoader: ITsEnginePlugin = {
        async resolve (source: string, importer?: string): Promise<string | void> {
            if (source.startsWith(externalOrigin)) {
                const id = resolveExternalProtocol(options, source);
                id2Source[id] = source;
                source2Id[source] = id;
                return id;
            }
            return undefined;
        },
    
        async load (id: string): Promise<string | void> {
            if (id in id2Source) {
                for (const suffix in loadConfig) {
                    if (id.endsWith(suffix)) {
                        const config = loadConfig[suffix];
                        if (config.shouldCullModule(options, id)) {
                            return config.cullingContent;
                        } else if (config.shouldEmitAsset(options, id)) {
                            return emitAsset(options, id);
                        } else {
                            return await _transformESM(id);
                        }
                    }
                }
                // fallback
                return fs.readFileSync(id, 'utf8');
            }
        },

        transformId (source: string, importer?: string): string | void {
            if (source in source2Id) {
                let id = source2Id[source];
                const shasum = createHash('sha1');
                shasum.update(fs.readFileSync(id, 'utf8').replace(/\r\n/g, '\n'));
                const hash = shasum.digest('hex').slice(0, 5);
                id = `${id}.${hash}.ts`;
                return id;
            }
        },
    };

    return externalWasmLoader;
}

export declare namespace externalWasmLoaderFactory {
    export interface Options {
        engineRoot: string;
        outDir?: string;
        /**
         * Whether cull meshopt module, including wasm and asm.js.
         */
        cullMeshopt: boolean;
    }
}