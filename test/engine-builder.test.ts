import * as ccbuild from '../src/index'
import * as ps from 'path';

test('test base', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const buildResult = await engineBuilder.build({
        root: __dirname,
        entries: [
            './test-source/exports/audio.ts',
            './test-source/exports/animation.ts'
        ],
        platform: 'OPEN_HARMONY',
        flagConfig: {
            DEBUG: true,
        },
    });
    expect(buildResult).toMatchInlineSnapshot(`{}`);
});