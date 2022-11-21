import { CCBuild } from '../src/index'

test('test base', async () => {
    const engineBuilder = new CCBuild.EngineBuilder();
    const buildResult = await engineBuilder.build({
        root: './test-source',
        entries: [
            './test-source/exports/audio.ts',
            './test-source/exports/animation.ts'
        ],
        platformConfig: {
            OPEN_HARMONY: true,
        },
        flagConfig: {
            DEBUG: true,
        },
    });
    expect(buildResult).toMatchInlineSnapshot(`{}`);
})