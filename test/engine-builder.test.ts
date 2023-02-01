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
        virtualModule: {
          'virtual': 'export const TEST = true;\nexport const EDITOR = false;'
        },
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
  "__virtual__/virtual.ts": {
    "code": "export const TEST = true;
export const EDITOR = false;",
  },
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
    "code": "import { EDITOR, TEST } from "virtual";

export class Player {
    play () {
        if (EDITOR) {
            console.log('this is editor');
        } else if (TEST) {
            console.log('this is test');
        }
    }
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