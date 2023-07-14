import * as ccbuild from '../../modules/build-engine/src/engine-ts/engine-builder';
import * as ps from 'path';
import del from 'del';
import { formatPath } from '@ccbuild/utils';
import { getOutputContent, getOutputDirStructure, renameNodeModules } from './utils';

jest.setTimeout(10000);
test('engine-ts', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = formatPath(ps.join(__dirname, '../test-engine-source'));
    const out = formatPath(ps.join(__dirname, './lib-ts'));
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
    for (const [k, v] of Object.entries(buildResult)) {
      const relativeFile = formatPath(ps.relative(root, v.file));
      res[relativeFile] = {
        code: v.code,
      };
    }
    expect(res).toMatchSnapshot();
    await del(out, { force: true });
});

test('node modules', async function () {
  const root = formatPath(ps.join(__dirname, '../test-engine-source'));
  const engineBuilder = new ccbuild.EngineBuilder();
  const out = formatPath(ps.join(__dirname, './lib-ts'));

  await renameNodeModules(root, async () => {
    await engineBuilder.build({
        root,
        features: ['node-modules'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    expect(await getOutputDirStructure(out)).toMatchSnapshot();
    expect(await getOutputContent(ps.join(out, './exports/node-modules.ts'))).toMatchSnapshot();
    await del(out, { force: true });
  });
});

describe('build time constant', function () {
  test('intrinsic flag', async function () {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = formatPath(ps.join(__dirname, '../test-engine-source'));
    const out = formatPath(ps.join(__dirname, './lib-ts'));
    await engineBuilder.build({
        root,
        features: ['intrinsic-flag-test'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    expect((await getOutputDirStructure(out)).filter(path => path.startsWith('intrinsic-flag'))).toMatchSnapshot();
    await del(out, { force: true });
  });
});

describe('WASM', () => {
  test('build WASM', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = formatPath(ps.join(__dirname, '../test-engine-source'));
    const out = formatPath(ps.join(__dirname, './lib-ts'));
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
    for (const [k, v] of Object.entries(buildResult)) {
      const relativeFile = formatPath(ps.relative(root, v.file));
      res[relativeFile] = {
        code: v.code,
      };
    }
    expect(res).toMatchSnapshot();
    await del(out, { force: true });
  });
});