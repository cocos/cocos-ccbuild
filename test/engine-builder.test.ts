import * as ccbuild from '../src/index'
import * as ps from 'path';

test('test base', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = ps.join(__dirname, './test-source').replace(/\\/g, '/');
    const buildResult = await engineBuilder.build({
        root,
        entries: [
          ps.join(__dirname, './test-source/exports/audio.ts').replace(/\\/g, '/'),
          ps.join(__dirname, './test-source/exports/animation.ts').replace(/\\/g, '/'),
        ],
        platform: 'OPEN_HARMONY',
        flagConfig: {
            DEBUG: true,
        },
        outDir: ps.join(__dirname, './lib').replace(/\\/g, '/'),
    });
    const files = Object.keys(buildResult);
    for (let file of files) {
      const data = buildResult[file];
      delete buildResult[file];
      const relativeFile = ps.relative(root, file).replace(/\\/g, '/');
      buildResult[relativeFile] = data;
    }
    expect(buildResult).toMatchInlineSnapshot(`
{
  "animation/animation.ts": {
    "code": "export class Animation {
    play () {}
}",
  },
  "animation/index.ts": {
    "code": "export * from './animation'",
  },
  "audio/index.ts": {
    "code": "export * from './player';",
  },
  "audio/player.ts": {
    "code": "export class Player {
    play () {}
}",
  },
  "exports/animation.ts": {
    "code": "export * from '../animation'",
  },
  "exports/audio.ts": {
    "code": "export * from '../audio'",
  },
}
`);
});