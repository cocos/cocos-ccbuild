import * as fs from 'fs-extra';
import * as ps from 'path';
import { ITsEnginePlugin } from './interface';

const externalOrigin = 'external:';

export function externalWasmLoaderFactory (options: externalWasmLoaderFactory.Options): ITsEnginePlugin {

    const externalWasmLoader: ITsEnginePlugin = {
        async resolve (source: string, importer?: string): Promise<string | void> {
            if (source.startsWith(externalOrigin)) {
                return source;
            }
            return undefined;
        },
    
        async load (id: string): Promise<string | void> {
            if (id.startsWith(externalOrigin)) {
                if (id.endsWith('.wasm')) {
                    return `export default 'WebAssembly is not supported !'`;
                } else {
                    const filePath = ps.join(options.engineRoot, id.replace(externalOrigin, 'native/external/'));
                    return fs.readFileSync(filePath, 'utf8');
                }
            }
            return undefined;
        },

        transformId (source: string, importer?: string): string | void {
            if (source.startsWith(externalOrigin)) {
                if (source.endsWith('.wasm')) {
                    // we generate a ts file to throw an message that we don't support wasm for now
                    return ps.join(options.engineRoot, source.replace(externalOrigin, 'native/external/') + '.ts');
                } else {
                    return ps.join(options.engineRoot, source.replace(externalOrigin, 'native/external/'));
                }
            }
            return undefined;
        }
    };

    return externalWasmLoader;
}

export declare namespace externalWasmLoaderFactory {
    export interface Options {
        engineRoot: string;
    }
}