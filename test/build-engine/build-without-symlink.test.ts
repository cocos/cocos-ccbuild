// We need to make sure the engine build tools can still works without symlink,
// so that we can fix the issue that the symlink is not cross-platform.

import { buildEngine } from '@ccbuild/build-engine';
import { ps } from '@ccbuild/utils';
import { getOutputContent, getOutputDirStructure } from '../utils';
import del from 'del';

test('engine-js', async () => {
    const input = ps.join(__dirname, '../test-engine-source-without-symlink');
    const out = ps.join(__dirname, './lib-js-no-symlink');
    await buildEngine({
        engine: input,
        out,
        mode: 'BUILD',
        platform: 'WECHAT',
        features: ['no-symlink'],
        moduleFormat: 'system',
    });
    expect(await getOutputDirStructure(out)).toMatchSnapshot('output dir structure');
    expect(await getOutputContent(ps.join(out, 'cc.js'))).toMatchSnapshot('output content');
    await del(out, { force: true });
});


test('engine-ts', async () => {
    const input = ps.join(__dirname, '../test-engine-source-without-symlink');
    const out = ps.join(__dirname, './lib-ts-no-symlink');
    await buildEngine({
        engine: input,
        out,
        mode: 'BUILD',
        platform: 'OPEN_HARMONY',
        preserveType: true,
        features: ['no-symlink'],
    });
    expect(await getOutputDirStructure(out)).toMatchSnapshot('output dir structure');
    expect(await getOutputContent(ps.join(out, 'no-symlink.ts'))).toMatchSnapshot('output no-symlink.ts content');
    await del(out, { force: true });
});