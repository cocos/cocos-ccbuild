import { ModuleQuery } from '@ccbuild/modularize';
import { ITsEnginePlugin } from './interface';

export async function moduleQueryPlugin (moduleQuery: ModuleQuery): Promise<ITsEnginePlugin> {
    const allModules = await moduleQuery.getAllModules();
    const resolvedMap: Record<string, string> = {};
    return {
        async resolve (source, importer): Promise<string | void> {
            if (allModules.includes(source)) {
                const resolvedId = await moduleQuery.resolveExport(source);
                resolvedMap[source] = resolvedId;
                return resolvedId;
            }
        },

        transformId (source, importer): string | void {
            if (resolvedMap[source]) {
                return resolvedMap[source];
            }
        },
    };
}