import * as ccbuild from '../../modules/build-engine/src/engine-ts/engine-builder';
import * as fs from 'fs';
import del from 'del';
import { formatPath, ps } from '@ccbuild/utils';
import { getOutputContent, getOutputDirStructure } from '../utils';
import { buildEngine } from '@ccbuild/build-engine';

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
            features: ['meshopt'],
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

describe('module override', function () {
    // Regression: module override targets in cc.config.json may be written extension-less
    // (as privatized pal modules are). The js/rollup build resolves the extension
    // automatically, but the native ts builder resolves files itself, so it must complete
    // the real file extension for override targets - otherwise `_load` throws
    // "Cannot load module: .../pal/system-info-test/native/system-info".
    test('completes extension for extension-less override target', async function () {
        const engineBuilder = new ccbuild.EngineBuilder();
        const root = formatPath(ps.join(__dirname, '../test-engine-source'));
        const out = formatPath(ps.join(__dirname, './lib-ts'));

        // Before the fix this call rejected while loading the override target.
        await expect(engineBuilder.build({
            root,
            features: ['extensionless-override'],
            platform: 'OPEN_HARMONY',
            mode: 'BUILD',
            flagConfig: {
                DEBUG: true,
            },
            outDir: out,
        })).resolves.toBeDefined();

        const structure = await getOutputDirStructure(out);
        // the extension-less override target is resolved to the real .ts file and emitted
        expect(structure).toContain('pal/system-info-test/native/system-info.ts');
        // the importer's specifier is rewritten to the resolved native module
        const indexContent = await getOutputContent(ps.join(out, 'extensionless-override/index.ts'));
        expect(indexContent).toContain('pal/system-info-test/native/system-info');

        await del(out, { force: true });
    });
});

describe('wildcard path alias', function () {
    // Regression: tsconfig `paths` wildcard aliases (e.g. "@cocos/engine/*": ["*"], used by
    // privatized pal to import engine internals) must be resolved by the native ts builder.
    // The `@cocos/` prefix also exercises node-module-loader's graceful fallback when the
    // specifier is not an installed node module.
    test('resolves wildcard tsconfig alias to source', async function () {
        const engineBuilder = new ccbuild.EngineBuilder();
        const root = formatPath(ps.join(__dirname, '../test-engine-source'));
        const out = formatPath(ps.join(__dirname, './lib-ts'));

        // Before the fix this rejected: node-module-loader threw on the unresolvable
        // `@cocos/test-engine/*` specifier, and the wildcard alias was never applied.
        await expect(engineBuilder.build({
            root,
            features: ['wildcard-alias'],
            platform: 'OPEN_HARMONY',
            mode: 'BUILD',
            flagConfig: {
                DEBUG: true,
            },
            outDir: out,
        })).resolves.toBeDefined();

        const structure = await getOutputDirStructure(out);
        // the aliased import resolves to the real source file, which gets emitted
        expect(structure).toContain('wildcard-alias/target.ts');
        // the `@cocos/test-engine/*` specifier is rewritten to the resolved relative module
        const indexContent = await getOutputContent(ps.join(out, 'wildcard-alias/index.ts'));
        expect(indexContent).toContain('./target');

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

test('dynamic import', async function () {
    const root = formatPath(ps.join(__dirname, '../test-engine-source'));
    const out = formatPath(ps.join(__dirname, './lib-ts'));
    await buildEngine({
        engine: root,
        out,
        mode: 'BUILD',
        platform: 'OPEN_HARMONY',
        preserveType: true,
        features: ['dynamic-import'],
    });
    const outputDirStructure = await getOutputDirStructure(out);
    expect(outputDirStructure).toMatchSnapshot('output dir structure');
    let indexFile = outputDirStructure.find(file => file.includes('dynamic-import/index.ts'));
    if (indexFile) {
        indexFile = ps.join(out, indexFile);
        const indexContent = fs.readFileSync(indexFile, 'utf8');
        expect(indexContent).toMatchSnapshot('index content');
    }
    await del(out, { force: true });
});