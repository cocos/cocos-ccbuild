import * as ccbuild from '../../src/build-engine/engine-ts/engine-builder'
import * as ps from 'path';
import { normalizePath } from '../../src/stats-query/path-utils';
import del from 'del';

jest.setTimeout(10000);
test('engine-ts', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = normalizePath(ps.join(__dirname, '../test-engine-source'));
    const out = normalizePath(ps.join(__dirname, './lib-ts'));
    const buildResult = await engineBuilder.build({
        root,
        features: ['audio', 'animation', 'dragon-bones'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    const res: any = {};
    for (let [k, v] of Object.entries(buildResult)) {
      const relativeFile = normalizePath(ps.relative(root, v.file));
      res[relativeFile] = {
        code: v.code,
      };
    }
    expect(res).toMatchSnapshot();
    await del(out, { force: true });
});

describe('WASM', () => {
  test('build WASM', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = normalizePath(ps.join(__dirname, '../test-engine-source'));
    const out = normalizePath(ps.join(__dirname, './lib-ts'));
    const buildResult = await engineBuilder.build({
        root,
        features: ['wasm-test'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    const res: any = {};
    for (let [k, v] of Object.entries(buildResult)) {
      const relativeFile = normalizePath(ps.relative(root, v.file));
      res[relativeFile] = {
        code: v.code,
      };
    }
    expect(res).toMatchSnapshot();
    await del(out, { force: true });
  });
});