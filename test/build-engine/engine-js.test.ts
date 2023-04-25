import { buildJsEngine } from '../../src/build-engine/engine-js';
import * as ps from 'path';
import * as fs from 'fs-extra';
import del from 'del';

jest.setTimeout(10000);

async function readdirR (item: string, reduceOutput: string[]) { 
    if ((await fs.stat(item)).isDirectory()) {
        const dirItems = await fs.readdir(item);
        for (let subItem of dirItems) {
            await readdirR(ps.join(item, subItem), reduceOutput);
        }
    } else {
        reduceOutput.push(item);
    }
}

describe('engine-js', () => {
    test('build WASM module on platform supporting WASM', async () => {
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
        outputScripts = outputScripts.map(item => ps.relative(out, item));
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
        outputScripts = outputScripts.map(item => ps.relative(out, item));
        expect(outputScripts).toMatchSnapshot();
        await del(out, { force: true });
    });
});