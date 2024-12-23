import { buildEngine } from '@ccbuild/build-engine';
import * as ps from 'path';
import * as fs from 'fs-extra';
import del from 'del';
import { getOutputContent, getOutputDirStructure } from '../utils';

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
            nativeCodeBundleMode: 'wasm',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });

        // build wasm module only
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['wasm-test'],
            moduleFormat: 'system',
            nativeCodeBundleMode: 'wasm',
            flags: {},
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
            nativeCodeBundleMode: 'wasm',
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
        
        // build wasm module only
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'HTML5',
            features: ['wasm-test'],
            moduleFormat: 'system',
            nativeCodeBundleMode: 'wasm',
            flags: {},
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
            nativeCodeBundleMode: 'asmjs',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });


        // build asmjs only
        const buildResult = await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['wasm-test'],
            moduleFormat: 'system',
            flags: {},
            nativeCodeBundleMode: 'asmjs',
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

    test('build width option nativeCodeBundleMode wasm', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            nativeCodeBundleMode: 'wasm',
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });


    test('build width option nativeCodeBundleMode asmjs', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            nativeCodeBundleMode: 'asmjs',
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build width option nativeCodeBundleMode both', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            nativeCodeBundleMode: 'both',
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
            nativeCodeBundleMode: 'wasm', 
            flags: {},
            moduleFormat: 'esm',
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('cull meshopt', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['cull-meshopt'],
            moduleFormat: 'system',
            nativeCodeBundleMode: 'wasm',
            flags: {
                CULL_MESHOPT: true,
            },
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('with wasm support');
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot('with wasm support');
        await del(out, { force: true });

        
        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'BYTEDANCE',
            features: ['cull-meshopt'],
            moduleFormat: 'system',
            nativeCodeBundleMode: 'asmjs',
            flags: {
                CULL_MESHOPT: true,
            },
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('without wasm support');
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot('without wasm support');
        await del(out, { force: true });
    });

    test('wasm compress mode', async () => {
        const out = ps.join(__dirname, './lib-js');

        await buildEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['wasm-test'],
            moduleFormat: 'system',
            nativeCodeBundleMode: 'wasm',
            wasmCompressionMode: 'brotli',
            flags: {},
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('with brotli');
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
            nativeCodeBundleMode: 'wasm',
            wasmCompressionMode: 'brotli',
            flags: {
                WASM_SUBPACKAGE: true,
            }
        });
        expect(await getOutputDirStructure(out)).toMatchSnapshot('wasm subpackage with brotli');
        // expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();  // this is too much for a snapshot output
        await del(out, { force: true });
    });

    test('inline enum', async () => {
        const out = ps.join(__dirname, './lib-js');

        const options: buildEngine.Options = {
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            platform: 'HTML5',
            moduleFormat: 'system',
            compress: false,
            split: false,
            nativeCodeBundleMode: 'wasm',
            assetURLFormat: 'runtime-resolved',
            noDeprecatedFeatures: false,
            sourceMap: false,
            features: ['enums'],
            loose: true,
            mode: 'BUILD',
            flags: {
                DEBUG: false,
                WEBGPU: false
            },
            inlineEnum: true,
        };

        await buildEngine(options);
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('WECHAT with treeshake option', async () => {
        const out = ps.join(__dirname, './lib-js');

        const options: buildEngine.Options = {
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            platform: 'WECHAT',
            moduleFormat: 'system',
            compress: false,
            split: false,
            nativeCodeBundleMode: 'wasm',
            assetURLFormat: 'runtime-resolved',
            noDeprecatedFeatures: false,
            sourceMap: false,
            features: ['base'],
            loose: true,
            mode: 'BUILD',
            flags: {
                DEBUG: false,
                WEBGPU: false
            },
        };

        await buildEngine(options);
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('HTML5 with treeshake option', async () => {
        const out = ps.join(__dirname, './lib-js');

        const options: buildEngine.Options = {
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            platform: 'HTML5',
            moduleFormat: 'system',
            compress: false,
            split: false,
            nativeCodeBundleMode: 'wasm',
            assetURLFormat: 'runtime-resolved',
            noDeprecatedFeatures: false,
            sourceMap: false,
            features: ['base'],
            loose: true,
            mode: 'BUILD',
            flags: {
                DEBUG: false,
                WEBGPU: false
            },
        };

        await buildEngine(options);
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('HTML5 mangle private properties', async () => {
        const out = ps.join(__dirname, './lib-js');

        const options: buildEngine.Options = {
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            platform: 'HTML5',
            moduleFormat: 'esm',
            compress: false,
            split: false,
            nativeCodeBundleMode: 'wasm',
            assetURLFormat: 'runtime-resolved',
            noDeprecatedFeatures: false,
            sourceMap: false,
            features: ['mangle-private-properties-test'],
            loose: true,
            mode: 'BUILD',
            mangleProperties: {
                mangleList: [
                    'ManglePropertyBase._mangleMeProp',
                    'ManglePropertyBase._mangleMeProp2',
                    'ManglePropertyBase.mangleMe',
                    'ManglePropertyBase.mangleMe2',
                ],
                dontMangleList: [
                    'ManglePropertyBase._dontMangleMeProp',
                    'ManglePropertyBase.dontMangleMeProp2',
                    'ManglePropertyBase.dontMangleMeProp3',
                    'ManglePropertyBase.dontMangleMe',
                    'ManglePropertyBase.dontMangleMe2',
                    'ManglePropertyBase.dontMangleMe3',
                ],
            },
            flags: {
                DEBUG: false,
                WEBGPU: false
            },
            targets: ['chrome 80'],
            inlineEnum: true,
        };

        await buildEngine(options);
        expect(await getOutputDirStructure(out)).toMatchSnapshot();
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });
});