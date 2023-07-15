import { rollup as Bundler } from '@ccbuild/bundler';
import { ITsEnginePlugin } from './interface';

import rollup = Bundler.core;
import rpCjs = Bundler.plugins.commonjs;
import rpNodeResolve = Bundler.plugins.nodeResolve;
import { formatPath } from '@ccbuild/utils';

interface ResolvedModuleData {
    /**
     * The resolved id.
     */
    id?: string;
    /**
     * The bundled node module code.
     */
    code?: string;
}

interface ResolvedModuleMap {
    [source: string]: ResolvedModuleData;
}


export function nodeModuleLoaderFactory (): ITsEnginePlugin {
    const resolvedModuleMap: ResolvedModuleMap = {};
    const nodeModuleLoader: ITsEnginePlugin = {
        async resolve (source: string, importer?: string): Promise<string | void> {
            if (source.startsWith('@cocos/') && importer) {
                if (resolvedModuleMap[source]?.id) {
                    return resolvedModuleMap[source].id;
                }
                const resolvedPath =  formatPath(require.resolve(source, { paths: [importer] }));
                resolvedModuleMap[source] ??= {
                    id: resolvedPath,
                };
                return resolvedPath;
            }
        },
    
        async load (id: string): Promise<string | void> {
            for (const [source, resolvedModuleData] of Object.entries(resolvedModuleMap)) {
                if (resolvedModuleData.id === id) {
                    if (resolvedModuleData.id) {
                        if (resolvedModuleData.code) {
                            return resolvedModuleData.code;
                        }
                        // bundle the node module
                        const res = await rollup.rollup({
                            input: resolvedModuleData.id,
                            plugins: [
                                rpNodeResolve(),
                                rpCjs(),
                            ],
                        });
                        const generateRes = await res.generate({
                            format: 'es',
                        });
                        return resolvedModuleData.code = generateRes.output[0].code;
                    }
                }
            }
        },

        transformId (source: string, importer?: string): string | void {
            if (source in resolvedModuleMap) {
                const resolvedModuleData = resolvedModuleMap[source];
                if (resolvedModuleData.id) {
                    return resolvedModuleData.id;
                }
            }
        },
    };

    return nodeModuleLoader;
}
