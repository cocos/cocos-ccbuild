import * as ccbuild from '../../modules/build-engine/src/engine-ts/engine-builder';
import * as fs from 'fs';
import del from 'del';
import { formatPath, ps } from '@ccbuild/utils';
import { getOutputContent, getOutputDirStructure } from '../utils';
import { buildEngine } from '@ccbuild/build-engine';

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
    await engineBuilder.build({
        root,
        features: ['wasm-test'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    const outputDirStructure = await getOutputDirStructure(out);
    const filesToDetect = outputDirStructure
      .filter(path => path.startsWith('native/external/wasm/emscripten') || path === 'wasm/emscripten.ts')
      .map(path => ps.join(out, path));
    const file2Code: Record<string, string> = {};
    for (const file of filesToDetect) {
      file2Code[formatPath(ps.relative(out, file))] = fs.readFileSync(file, 'utf8');
    }
    expect(outputDirStructure).toMatchSnapshot('get output dir structure');
    expect(file2Code).toMatchSnapshot('file 2 code');
    await del(out, { force: true });
  });

  
  test('cull meshopt', async () => {
    const out = ps.join(__dirname, './lib-ts');
    await buildEngine({
        engine: ps.join(__dirname, '../test-engine-source'),
        out,
        mode: 'BUILD',
        platform: 'OPEN_HARMONY',
        preserveType: true,
        features: ['cull-meshopt'],
        moduleFormat: 'system',
        flags: {
            CULL_MESHOPT: true,
        },
    });
    const outputDirStructure = await getOutputDirStructure(out);
    expect(outputDirStructure).toMatchSnapshot('output dir structure');
    const asmModule = outputDirStructure.find(file => file.includes('meshopt_decoder.asm.js'));
    if (asmModule) {
      expect(await getOutputContent(ps.join(out, asmModule))).toMatchSnapshot('asm module content');
    }
    await del(out, { force: true });
  });
});

describe('circular reference', function () {
  test('circular reference', async function () {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = formatPath(ps.join(__dirname, '../test-engine-source'));
    const out = formatPath(ps.join(__dirname, './lib-ts'));
    await engineBuilder.build({
        root,
        features: ['circular-reference'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    // it should build successfully instead of waiting for the dep modules
    await del(out, { force: true });
  });
});


describe('type build', function () {
  test('type merge', async function () {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = formatPath(ps.join(__dirname, '../test-engine-source'));
    const out = formatPath(ps.join(__dirname, './lib-ts'));
    await engineBuilder.build({
        root,
        features: ['type-merge'],
        platform: 'OPEN_HARMONY',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: out,
    });
    expect(await getOutputDirStructure(out)).toMatchSnapshot();
    await del(out, { force: true });
  });
});