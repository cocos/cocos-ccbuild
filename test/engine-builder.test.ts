import { EngineBuilder } from '../src/engine-builder';
import * as ps from 'path';
import { normalizePath } from '../src/stats-query/path-utils';

jest.setTimeout(10000);
test('test base', async () => {
    const engineBuilder = new EngineBuilder();
    const root = normalizePath(ps.join(__dirname, './test-source'));
    const buildResult = await engineBuilder.build({
        root,
        features: ['audio', 'animation', 'dragon-bones'],
        platform: 'NATIVE',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: normalizePath(ps.join(__dirname, './lib')),
    });
    const res: any = {};
    for (let [k, v] of Object.entries(buildResult)) {
      const relativeFile = normalizePath(ps.relative(root, v.file));
      res[relativeFile] = {
        code: v.code,
      };
    }
    expect(res).toMatchSnapshot();
});

test('resolves extension-less module override target', async () => {
    const engineBuilder = new EngineBuilder();
    const root = normalizePath(ps.join(__dirname, './test-source'));
    await expect(engineBuilder.build({
        root,
        features: ['extensionless-override'],
        platform: 'NATIVE',
        mode: 'BUILD',
        flagConfig: { DEBUG: true },
    })).resolves.toBeDefined();
});

test('resolves wildcard tsconfig alias to source', async () => {
    const engineBuilder = new EngineBuilder();
    const root = normalizePath(ps.join(__dirname, './test-source'));
    const result = await engineBuilder.build({
        root,
        features: ['wildcard-alias'],
        platform: 'NATIVE',
        mode: 'BUILD',
        flagConfig: { DEBUG: true },
    });
    expect(Object.keys(result).some((file) => file.endsWith('/wildcard-alias/target.ts'))).toBe(true);
});
