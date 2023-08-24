import { absolutePathFuncFactory, ps } from '@ccbuild/utils';
import { ModuleQuery } from '@ccbuild/modularize';

const absolutePath = absolutePathFuncFactory(__dirname);
const engineRoot = absolutePath('../test-engine-source');
function relativeToRoot (path: string): string {
    return ps.relative(engineRoot, path);
}

test('get all modules and config', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
    });
    expect(await mq.getAllModules()).toMatchSnapshot();
    expect(await mq.getConfig('@module-query/utils')).toMatchSnapshot();
});

test('resolve package json', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
    });
    expect(relativeToRoot(await mq.resolvePackageJson('@module-query/env'))).toMatchSnapshot();
});

test('resolve platform export', async () => {
    const mq1 = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
    });
    expect(relativeToRoot(await mq1.resolveExport('@module-query/env'))).toMatchSnapshot();
    const mq2 = new ModuleQuery({
        engine: engineRoot,
        platform: 'WEB_DESKTOP',
    });
    expect(relativeToRoot(await mq2.resolveExport('@module-query/env'))).toMatchSnapshot();
    const mq3 = new ModuleQuery({
        engine: engineRoot,
        platform: 'ALIPAY',
    });
    expect(relativeToRoot(await mq3.resolveExport('@module-query/env'))).toMatchSnapshot();
    const mq4 = new ModuleQuery({
        engine: engineRoot,
        platform: 'VIVO',
    });
    expect(relativeToRoot(await mq4.resolveExport('@module-query/env'))).toMatchSnapshot();
    const mq5 = new ModuleQuery({
        engine: engineRoot,
        platform: 'NATIVE',
    });
    expect(relativeToRoot(await mq5.resolveExport('@module-query/env'))).toMatchSnapshot();
    const mq6 = new ModuleQuery({
        engine: engineRoot,
        platform: 'ANDROID',
    });
    expect(relativeToRoot(await mq6.resolveExport('@module-query/env'))).toMatchSnapshot();
});

test('resolve types export', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
    });
    expect(relativeToRoot(await mq.resolveExport('@module-query/utils'))).toMatchSnapshot();
});

test('resolve custom export', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
        customExportConditions: ['custom2', 'custom1'],
    });
    expect(relativeToRoot(await mq.resolveExport('@module-query/env'))).toMatchSnapshot();
});
