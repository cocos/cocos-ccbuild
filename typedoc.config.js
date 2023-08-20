/** @type {import('typedoc').TypeDocOptions} */
const config = {
    entryPoints: './src/index.ts',
    out: './docs',
    excludePrivate: true,
    excludeExternals: false,
    cleanOutputDir: true,
    sort: ['visibility', 'alphabetical', 'static-first',],

    navigation: {
        includeCategories: false,
        includeGroups: false,
        fullTree: true,
    },
    // the implementation of typedoc tells that we should not define external or private
    visibilityFilters: {
        protected: true,
        inherited: true,
    },
};

module.exports = config;
