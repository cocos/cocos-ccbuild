const { ModuleManager } = require('../lib/index.js');
const ps = require('path');

(async function () {
    const mm = new ModuleManager();
    const result = await mm.initModule(ps.join(__dirname, '../'), {
        pkgName: '@ccbuild/modularize',
        extendTsconfigPath: ps.join(__dirname, '../../../tsconfig.json'),
    });
    for (let mf of result.memoryFiles) {
        await mf.outputFile();
    }
})();
