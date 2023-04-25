import { buildJsEngine } from '../../src/build-engine/engine-js';
import * as ps from 'path';
import { StatsQuery } from '../../src/stats-query';

jest.setTimeout(10000);
test('engine-js', async () => {
    await buildJsEngine({
        engine: ps.join(__dirname, '../test-engine-source'),
        out: ps.join(__dirname, './lib-js'),
        mode: 'BUILD',
        platform: 'HTML5',
        features: ['wasm-test'],
        moduleFormat: 'system',
    });
});