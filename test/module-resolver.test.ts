import { ModuleResolver } from "../src/module-resolver";
import ps from 'path';

test.skip('resolve module', () => {
    const mr = new ModuleResolver();
    const testSourcePath = ps.join(__dirname, './test-source');
    const resolveResult = mr.resolve(ps.join(testSourcePath, './animation/editor-index.ts'));
    resolveResult.deps = resolveResult.deps.map(dep => ps.relative(testSourcePath, dep));
    resolveResult.id = ps.relative(testSourcePath, resolveResult.id);
    expect(resolveResult).toMatchInlineSnapshot(`
{
  "deps": [
    "animation\\editor-animation.ts",
    "animation\\animation.ts",
  ],
  "id": "animation\\editor-index.ts",
}
`);
});