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
    expect(await getOutputContent(ps.join(out, 'cc.d.ts'))).toMatchSnapshot('cc.d.ts content');
    expect(await getOutputContent(ps.join(out, 'cc.editor.d.ts'))).toMatchSnapshot('cc.editor.d.ts content');

    await del(out, { force: true });
});

// When PAL is privatized, its source is distributed as pre-compiled .d.ts files.
// TypeScript's emitOnlyDtsFiles skips .d.ts inputs, so the PAL declarations would
// not appear in the unbundled directory that gift reads from. The dts-bundler mirrors
// PAL .d.ts files into that directory so gift can resolve PAL types correctly.
test('bundle dts with precompiled pal .d.ts', async () => {
    const entry = ps.join(__dirname, '../test-engine-source-pal-precompiled');
    const out = ps.join(__dirname, './lib-dts-pal-precompiled');
    const result = await build({
        engine: entry,
        outDir: out,
    });

    expect(result).toBe(true);

    const ccDts = await getOutputContent(ps.join(out, 'cc.d.ts'));
    // PalAudioPlayer is defined only in pal/audio/index.d.ts (a pre-compiled .d.ts).
    // Without the mirror fix, gift cannot resolve it and the class disappears from output.
    expect(ccDts).toContain('PalAudioPlayer');

    await del(out, { force: true });
});