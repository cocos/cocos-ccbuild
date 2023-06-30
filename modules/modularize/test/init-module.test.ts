import { absolutePathFuncFactory, formatPath } from "@ccbuild/utils";
import { ModuleManager } from "../src/index";
import ps from 'path';

const absolutePath = absolutePathFuncFactory(__dirname);

test('init module', async () => {
    const mm = new ModuleManager();
    const modulePath = absolutePath('./module-to-init/');
    const result = await mm.initModule(modulePath, { pkgName: 'test-pkg-name', extendTsconfigPath: absolutePath('../../../tsconfig.json') });
    result.memoryFiles.forEach(memoryFile => {
        memoryFile.path = formatPath(ps.relative(modulePath, memoryFile.path));
    });
    expect(result.memoryFiles).toMatchSnapshot();
});