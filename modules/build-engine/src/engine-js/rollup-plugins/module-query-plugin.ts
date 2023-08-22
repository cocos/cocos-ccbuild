import rollup from 'rollup';
import { ModuleQuery } from '@ccbuild/modularize';

export default async function moduleQueryPlugin (moduleQuery: ModuleQuery): Promise<rollup.Plugin> {
    const allModules = await moduleQuery.getAllModules();
    return {
        name: '@cocos/ccbuild|module-query-plugin',
        async resolveId (source, importer, options): Promise<rollup.ResolveIdResult> {
            if (allModules.includes(source)) {
                return moduleQuery.resolveExport(source);
            }
        },
    };
}