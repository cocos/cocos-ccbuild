import { rollup as Bundler } from '@ccbuild/bundler';
import { ModuleQuery } from '@ccbuild/modularize';

import rollup = Bundler.core;

export default function moduleQueryPlugin (moduleQuery: ModuleQuery): rollup.Plugin {
    return {
        name: '@cocos/ccbuild|module-query-plugin',
        async resolveId (source, importer, options): Promise<rollup.ResolveIdResult> {
            return moduleQuery.resolveExport(source);
        },
    };
}