import { StatsQuery } from '@ccbuild/stats-query';
import ps from 'path';

const ConstantManager = StatsQuery.ConstantManager;
const cm = new ConstantManager(ps.join(__dirname, '../test-engine-source/'));

test('generateInternalConstants', () => {
  expect(cm.genInternalConstants()).toMatchSnapshot();
});

test('generateCCEnv', () => {
  expect(cm.genCCEnv()).toMatchSnapshot();
});

test('genCCEnvConstants', () => {
    expect(cm.genCCEnvConstants({
        mode: 'TEST',
        platform: 'NATIVE',
        flags: { DEBUG: false, SERVER_MODE: true, FORCE_BANNING_BULLET_WASM: true },
      })).toMatchSnapshot();
});

test('exportStaticConstants', () => {
  expect(
    cm.exportStaticConstants({
      mode: 'PREVIEW',
      platform: 'WECHAT',
      flags: { DEBUG: false, SERVER_MODE: true, FORCE_BANNING_BULLET_WASM: true, CULL_ASM_JS_MODULE: false },
    })
  ).toMatchSnapshot();
});

test('exportDynamicConstants', () => {
  expect(
    cm.exportDynamicConstants({
      mode: 'BUILD',
      platform: 'WECHAT',
      flags: { DEBUG: true, SERVER_MODE: true, FORCE_BANNING_BULLET_WASM: true, CULL_ASM_JS_MODULE: true },
    })
  ).toMatchSnapshot();
});

test('genBuildTimeConstants', () => {
  const result = cm.genBuildTimeConstants({
    mode: 'TEST',
    platform: 'NATIVE',
    flags: { DEBUG: false, SERVER_MODE: true, FORCE_BANNING_BULLET_WASM: true, CULL_ASM_JS_MODULE: true },
  });
  expect(result).toMatchSnapshot();
});
