import { buildEngine } from '@ccbuild/build-engine';
import * as ps from 'path';
import * as fs from 'fs-extra';
import del from 'del';
import { getOutputContent, getOutputDirStructure } from '../utils';

jest.setTimeout(10000);

describe('engine-js', () => {
    test('build WASM module on platform supporting WASM', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['wasm-test'],
            moduleFormat: 'system',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });

        // cull asm.js module
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['wasm-test'],
            moduleFormat: 'system',
            flags: {
                CULL_ASM_JS_MODULE: true,
            }
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('cull asm.js module');
        // expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();  // this is too much for a snapshot output
        await del(out, { force: true });

        // wasm subpackage
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['wasm-test'],
            moduleFormat: 'system',
            flags: {
                WASM_SUBPACKAGE: true,
            }
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('wasm subpackage');
        // expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();  // this is too much for a snapshot output
        await del(out, { force: true });
    });

    test('build WASM module on platform maybe supporting WASM', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'HTML5',
            features: ['wasm-test'],
            moduleFormat: 'system',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
        
        // cull asm.js module
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'HTML5',
            features: ['wasm-test'],
            moduleFormat: 'system',
            flags: {
                CULL_ASM_JS_MODULE: true,
            }
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('cull asm.js module');
        // expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();  // this is too much for a snapshot output
        await del(out, { force: true });
    });
    
    test('build WASM module on platform not supporting WASM', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['wasm-test'],
            moduleFormat: 'system',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });

        // cull asm.js module
        const buildResult = await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['wasm-test'],
            moduleFormat: 'system',
            flags: {
                CULL_ASM_JS_MODULE: true,
            }
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('cull asm.js module');
        // expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();  // this is too much for a snapshot output
        await del(out, { force: true });

        
        expect(buildResult).toMatchSnapshot('build result');
    });

    test('enumerate dependents', async () => {
        const out = ps.join(__dirname, './lib-js');
        const features = ['wasm-test'];
        const res = await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features,
            moduleFormat: 'system',
            split: true,
        });
        
        expect(buildEngine.enumerateAllDependents(res, features)).toMatchSnapshot();
        expect(buildEngine.enumerateDependentChunks(res, features)).toMatchSnapshot();
        expect(buildEngine.enumerateDependentAssets(res, features)).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build width option ammoJsWasm true', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            ammoJsWasm: true,
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });


    test('build width option ammoJsWasm false', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            ammoJsWasm: false,
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build width option ammoJsWasm fallback', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            ammoJsWasm: 'fallback',
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build without option ammoJsWasm', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('intrinsic flag', async function () {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['intrinsic-flag-test'],
            moduleFormat: 'esm',
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('inline dynamic import for OH platform', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'OPEN_HARMONY',
            features: ['wasm-test'],
            flags: {
                // force flag value to test inline dynamic import
                WASM_SUPPORT_MODE: 1,
                WASM_FALLBACK: true,
            },
            moduleFormat: 'esm',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        await del(out, { force: true });
    });
});