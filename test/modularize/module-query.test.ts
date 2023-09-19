import { absolutePathFuncFactory, ps } from '@ccbuild/utils';
import { ModuleQuery } from '@ccbuild/modularize';

const absolutePath = absolutePathFuncFactory(__dirname);
const engineRoot = absolutePath('../test-engine-source');
function relativeToRoot (path: string): string {
    return ps.relative(engineRoot, path);
}

test('query test', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
    });
    expect(await mq.getAllModules()).toMatchSnapshot('get all modules');
    expect(await mq.getExports('@module-query/env')).toMatchSnapshot('get @module-query/env exports');
    expect(await mq.getAllExports()).toMatchSnapshot('get all modules exports');
    expect(await mq.getConfig('@module-query/utils')).toMatchSnapshot('get config');
    const exportMap = await mq.getExportMap();
    for (const [k, v] of Object.entries(exportMap)) {
        exportMap[k] = ps.relative(engineRoot, v);
    }
    expect(exportMap).toMatchSnapshot('get export map');
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
    const resolved1 = await mq1.resolveExport('@module-query/env');
    if (resolved1) {
        expect(relativeToRoot(resolved1)).toMatchSnapshot();
    }
    const mq2 = new ModuleQuery({
        engine: engineRoot,
        platform: 'WEB_DESKTOP',
    });
    const resolved2 = await mq2.resolveExport('@module-query/env');
    if (resolved2) {
        expect(relativeToRoot(resolved2)).toMatchSnapshot();
    }
    const mq3 = new ModuleQuery({
        engine: engineRoot,
        platform: 'ALIPAY',
    });
    const resolved3 = await mq3.resolveExport('@module-query/env');
    if (resolved3) {
        expect(relativeToRoot(resolved3)).toMatchSnapshot();
    }
    const mq4 = new ModuleQuery({
        engine: engineRoot,
        platform: 'VIVO',
    });
    const resolved4 = await mq4.resolveExport('@module-query/env');
    if (resolved4) {
        expect(relativeToRoot(resolved4)).toMatchSnapshot();
    }
    const mq5 = new ModuleQuery({
        engine: engineRoot,
        platform: 'NATIVE',
    });
    const resolved5 = await mq5.resolveExport('@module-query/env');
    if (resolved5) {
        expect(relativeToRoot(resolved5)).toMatchSnapshot();
    }
    const mq6 = new ModuleQuery({
        engine: engineRoot,
        platform: 'ANDROID',
    });
    const resolved6 = await mq6.resolveExport('@module-query/env');
    if (resolved6) {
        expect(relativeToRoot(resolved6)).toMatchSnapshot();
    }
});

test('resolve types export', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
    });
    const resolved = await mq.resolveExport('@module-query/utils');
    if (resolved) {
        expect(relativeToRoot(resolved)).toMatchSnapshot();
    }
});

test('resolve custom export', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'HTML5',
        customExportConditions: ['custom2', 'custom1'],
    });
    const resolved = await mq.resolveExport('@module-query/env');
    if (resolved) {
        expect(relativeToRoot(resolved)).toMatchSnapshot();
    }
});

test('resolve editor and internal export', async () => {
    const mq = new ModuleQuery({
        engine: engineRoot,
        platform: 'ALIPAY',
    });
    const resolved1 = await mq.resolveExport('@module-query/env/editor');
    if (resolved1) {
        expect(relativeToRoot(resolved1)).toMatchSnapshot();
    }
    const resolved2 = await mq.resolveExport('@module-query/env/internal');
    if (resolved2) {
        expect(relativeToRoot(resolved2)).toMatchSnapshot();
    }
    const mq2 = new ModuleQuery({
        engine: engineRoot,
        platform: 'WEB_DESKTOP',
    });
    const resolved3 = await mq2.resolveExport('@module-query/env/internal');
    if (resolved3) {
        expect(relativeToRoot(resolved3)).toMatchSnapshot();
    }
    expect(await mq2.resolveExport('@module-query/env/test')).toBeUndefined();
    expect(await mq2.resolveExport('test')).toBeUndefined();
    expect(await mq2.resolveExport('./test')).toBeUndefined();
});
