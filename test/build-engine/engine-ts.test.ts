import * as ccbuild from '../../src/build-engine/engine-ts/engine-builder'
import * as ps from 'path';
import { normalizePath } from '../../src/stats-query/path-utils';

jest.setTimeout(10000);
test('test base', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = normalizePath(ps.join(__dirname, '../test-source'));
    const buildResult = await engineBuilder.build({
        root,
        features: ['audio', 'animation', 'dragon-bones'],
        platform: 'NATIVE',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: normalizePath(ps.join(__dirname, './lib')),
    });
    const res: any = {};
    for (let [k, v] of Object.entries(buildResult)) {
      const relativeFile = normalizePath(ps.relative(root, v.file));
      res[relativeFile] = {
        code: v.code,
      };
    }
    expect(res).toMatchSnapshot();
});