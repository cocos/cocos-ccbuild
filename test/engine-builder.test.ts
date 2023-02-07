import * as ccbuild from '../src/index'
import * as ps from 'path';
import { normalizePath } from '../src/stats-query/path-utils';

test('test base', async () => {
    const engineBuilder = new ccbuild.EngineBuilder();
    const root = normalizePath(ps.join(__dirname, './test-source'));
    const buildResult = await engineBuilder.build({
        root,
        features: ['audio', 'animation'],
        platform: 'NATIVE',
        mode: 'BUILD', 
        flagConfig: {
            DEBUG: true,
        },
        outDir: normalizePath(ps.join(__dirname, './lib')),
    });
    const files = Object.keys(buildResult);
    for (let file of files) {
      const data = buildResult[file];
      // @ts-ignore
      delete data.deps;
      delete buildResult[file];
      const relativeFile = normalizePath(ps.relative(root, file));
      buildResult[relativeFile] = data;
    }
    expect(buildResult).toMatchSnapshot();
});