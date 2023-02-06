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
        platform: 'NATIVE',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: ps.join(__dirname, './lib').replace(/\\/g, '/'),
        virtualModule: {
          'virtual:const': 'export const TEST = true;\nexport const EDITOR = false;'
        },
    });
    const files = Object.keys(buildResult);
    for (let file of files) {
      const data = buildResult[file];
      // @ts-ignore
      delete data.deps;
      delete buildResult[file];
      const relativeFile = ps.relative(root, file).replace(/\\/g, '/');
      buildResult[relativeFile] = data;
    }
    expect(buildResult).toMatchSnapshot();
});