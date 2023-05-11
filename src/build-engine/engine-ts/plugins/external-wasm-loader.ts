import * as fs from 'fs-extra';
import * as ps from 'path';

const externalOrigin = 'external:';

export function externalWasmLoaderFactory (options: externalWasmLoaderFactory.Options): ITsEnginePlugin {

    const externalWasmLoader: ITsEnginePlugin = {
        resolve (id: string, importer?: string): string | void {
            if (id.startsWith(externalOrigin)) {
                return id;
            }
            return undefined;
        },
    
        load (id: string): string | void {
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

        transformId (id: string, importer?: string): string | void {
            if (id.startsWith(externalOrigin)) {
                if (id.endsWith('.wasm')) {
                    // we generate a ts file to throw an message that we don't support wasm for now
                    return ps.join(options.engineRoot, id.replace(externalOrigin, 'native/external/') + '.ts');
                } else {
                    return ps.join(options.engineRoot, id.replace(externalOrigin, 'native/external/'));
                }
            }
            return undefined;
        }
    }

    return externalWasmLoader;
}

export declare namespace externalWasmLoaderFactory {
    export interface Options {
        engineRoot: string;
    }
}