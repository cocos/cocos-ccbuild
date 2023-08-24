import { ModuleQuery } from '@ccbuild/modularize';
import { ITsEnginePlugin } from './interface';

export function moduleQueryPlugin (moduleQuery: ModuleQuery): ITsEnginePlugin {
    const resolvedMap: Record<string, string> = {};
    return {
        async resolve (source, importer): Promise<string | void> {
            const resolvedModule = await moduleQuery.resolveExport(source);
            if (resolvedModule) {
                return resolvedMap[source] = resolvedModule;
            }
        },

        transformId (source, importer): string | void {
            if (resolvedMap[source]) {
                return resolvedMap[source];
            }
        },
    };
}