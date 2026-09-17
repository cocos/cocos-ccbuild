import ps from 'path';

import tsConfigPaths from '../../modules/build-engine/src/engine-js/rollup-plugins/ts-paths';

test('resolves exact and wildcard tsconfig path aliases to real files', () => {
    const engine = ps.join(__dirname, '../test-engine-source');
    const plugin = tsConfigPaths({
        configFileName: ps.join(engine, 'tsconfig.json'),
    });
    const resolveId = plugin.resolveId;
    expect(typeof resolveId).toBe('function');
    if (typeof resolveId !== 'function') {
        throw new Error('Expected ts-paths to expose a resolveId hook.');
    }

    const resolve = (source: string): unknown => resolveId.call({} as never, source, undefined, {} as never);
    expect(resolve('cc.decorator')).toBe(ps.join(engine, 'decorators.ts'));
    expect(resolve('@cocos/test-engine/wildcard-alias/target'))
        .toBe(ps.join(engine, 'wildcard-alias/target.ts'));
    expect(resolve('@cocos/unknown')).toBeNull();
});
