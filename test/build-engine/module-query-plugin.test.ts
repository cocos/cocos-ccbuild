import { buildEngine } from '@ccbuild/build-engine';
import { ps } from '@ccbuild/utils';
import '../utils';
import { getOutputContent, getOutputDirStructure } from '../utils';
import del from 'del';
import fs from 'fs-extra';

describe('module query plugin', () => {
    const engineRoot = ps.join(__dirname, '../test-engine-source');

    test('js engine', async () => {
        const out = ps.join(__dirname, './lib-js-module-query-plugin');
        await buildEngine({
            engine: engineRoot,
            out,
            mode: 'BUILD',
            platform: 'WECHAT',
            features: ['module-query'],
            moduleFormat: 'system',
        });
        expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot();
        await del(out, { force: true });
    });

    test('ts engine', async () => {
        const out = ps.join(__dirname, './lib-ts-module-query-plugin');
        await buildEngine({
            engine: engineRoot,
            out,
            mode: 'BUILD',
            platform: 'OPEN_HARMONY',
            preserveType: true,
            features: ['module-query'],
        });
        const outputDirStructure = (await getOutputDirStructure(out)).filter(item => item.includes('module-query'));
        expect(outputDirStructure).toMatchSnapshot();

        const script = outputDirStructure.find(item => item === 'module-query/index.ts');
        if (script) {
            const content = await fs.readFile(ps.join(out, script), 'utf8');
            expect(content).toMatchSnapshot();
        }
        await del(out, { force: true });
    });
});