import type * as rollup from 'rollup';
import { URL, fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import ps from 'path';

const externalOrigin = 'external://';
function normalizePath (path: string) {
    return path.replace(/\\/g, '/');
}

/**
 * This plugin enable to load script or wasm with url based on 'external://' origin.
 */
export function externalWasmLoader (options: assetRef.Options): rollup.Plugin {
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
                if (filePath.endsWith('.wasm')) {
                    if (options.supportWasm) {
                        const referenceId = this.emitFile({
                            type: 'asset',
                            name: ps.basename(filePath),
                            // fileName: path,
                            source: await fs.readFile(filePath),
                        });

                        return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
                    } else {
                        return `export default '';`;
                    }
                } else {
                    const a = await fs.readFile(filePath, 'utf8');
                    return a;
                }
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

export declare namespace assetRef {
    export interface Options {
        /**
         * the root path of external repository
         */
        externalRoot: string,
        /**
         * whether support wasm, if false, the plugin won't emit the wasm asset to reduce engine package size.
         */
        supportWasm: boolean;
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
