import { build } from '@ccbuild/dts-bundler';
import { ps } from '@ccbuild/utils';
import del from 'del';
import { getOutputContent, getOutputDirStructure } from '../utils';

test('bundle dts', async () => {
    const entry = ps.join(__dirname, '../test-engine-source');
    const out = ps.join(__dirname, './lib-dts');
    await build({
        engine: entry,
        outDir: out,
    });

    expect(await getOutputDirStructure(out)).toMatchSnapshot('director structure');
    expect(await getOutputContent(ps.join(out, 'cc.editor.d.ts'))).toMatchSnapshot('cc.editor.d.ts content');

    await del(out, { force: true });
});