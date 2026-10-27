import ps from 'path';

import { rpInlineEnum } from '../../modules/build-engine/src/engine-js/rollup-plugins/inline-enum';

test('leaves relative JavaScript imports for Rollup to resolve', async () => {
    const [plugin] = await rpInlineEnum({
        scanDir: __dirname,
        scanPattern: [],
    });
    const resolveId = plugin.resolveId;
    expect(typeof resolveId).toBe('function');
    if (typeof resolveId !== 'function') {
        throw new Error('Expected inline-enum to expose a resolveId hook.');
    }

    const resolve = async (source: string): Promise<unknown> => resolveId.call(
        {} as never,
        source,
        undefined,
        {} as never,
    );
    await expect(resolve('../enum-type/browser-type.js')).resolves.toBeNull();
    const absoluteModule = ps.join(__dirname, 'browser-type.js');
    await expect(resolve(absoluteModule)).resolves.toBe(absoluteModule);
});
