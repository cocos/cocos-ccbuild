import { buildJsEngine } from '../../src/build-engine/engine-js';
import * as ps from 'path';
import * as fs from 'fs-extra';
import del from 'del';
import { readdirR } from './utils';
import { formatPath } from '../../src/utils';

jest.setTimeout(10000);

describe('engine-js', () => {
    test('build WASM module on platform supporting WASM', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['wasm-test'],
            moduleFormat: 'system',
        });
        let outputScripts: string[] = [];
        await readdirR(out, outputScripts);
        outputScripts = outputScripts.map(item => formatPath(ps.relative(out, item)));
        expect(outputScripts).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build WASM module on platform maybe supporting WASM', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'HTML5',
            features: ['wasm-test'],
            moduleFormat: 'system',
        });
        let outputScripts: string[] = [];
        await readdirR(out, outputScripts);
        outputScripts = outputScripts.map(item => formatPath(ps.relative(out, item)));
        expect(outputScripts).toMatchSnapshot();
        await del(out, { force: true });
    });

    
    test('build WASM module on platform not supporting WASM', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['wasm-test'],
            moduleFormat: 'system',
        });
        let outputScripts: string[] = [];
        await readdirR(out, outputScripts);
        outputScripts = outputScripts.map(item => formatPath(ps.relative(out, item)));
        expect(outputScripts).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build width option ammoJsWasm true', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            ammoJsWasm: true,
        });
        const cc = await fs.readFile(ps.join(out, 'cc.js'), 'utf8');
        expect(cc).toMatchSnapshot();
        await del(out, { force: true });
    });


    test('build width option ammoJsWasm false', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            ammoJsWasm: false,
        });
        const cc = await fs.readFile(ps.join(out, 'cc.js'), 'utf8');
        expect(cc).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build width option ammoJsWasm fallback', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
            ammoJsWasm: 'fallback',
        });
        const cc = await fs.readFile(ps.join(out, 'cc.js'), 'utf8');
        expect(cc).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('build without option ammoJsWasm', async () => {
        const out = ps.join(__dirname, './lib-js');
        await buildJsEngine({
            engine: ps.join(__dirname, '../test-engine-source'),
            out,
            mode: 'BUILD',
            platform: 'XIAOMI',
            features: ['internal-constants'],
            moduleFormat: 'esm',
        });
        const cc = await fs.readFile(ps.join(out, 'cc.js'), 'utf8');
        expect(cc).toMatchSnapshot();
        await del(out, { force: true });
    });
});