import { StatsQuery } from '@ccbuild/stats-query';
import ps from 'path';

const ConstantManager = StatsQuery.ConstantManager;
const cm = new ConstantManager(ps.join(__dirname, '../test-engine-source/'));

test.each(['test-engine-source', 'test-engine-source-without-symlink'])('GI_BYTEDANCE constants in %s', (engine) => {
    const manager = new ConstantManager(ps.join(__dirname, '..', engine));
    const options = { mode: 'BUILD', platform: 'GI_BYTEDANCE', flags: {} } as const;
    expect(manager.genBuildTimeConstants(options)).toMatchObject({
        GI_BYTEDANCE: true,
        MINIGAME: true,
        TAOBAO_MINIGAME: false,
        BYTEDANCE: false,
    });
    expect(manager.genCCEnvConstants(options)).toMatchObject({ GI_BYTEDANCE: true });
    expect(manager.exportStaticConstants(options)).toContain('export const GI_BYTEDANCE = true;');
    expect(manager.genBuildTimeConstants({ mode: 'BUILD', platform: 'HTML5', flags: {} }))
        .toMatchObject({ GI_BYTEDANCE: false, MINIGAME: false });
});

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
        flags: { DEBUG: false, SERVER_MODE: true },
    })).toMatchSnapshot();
});

test('exportStaticConstants', () => {
    expect(
        cm.exportStaticConstants({
            mode: 'PREVIEW',
            platform: 'WECHAT',
            flags: { DEBUG: false, SERVER_MODE: true },
        })
    ).toMatchSnapshot();
});

test('exportDynamicConstants', () => {
    expect(
        cm.exportDynamicConstants({
            mode: 'BUILD',
            platform: 'WECHAT',
            flags: { DEBUG: true, SERVER_MODE: true },
        })
    ).toMatchSnapshot();
});

test('genBuildTimeConstants', () => {
    const result = cm.genBuildTimeConstants({
        mode: 'TEST',
        platform: 'NATIVE',
        flags: { DEBUG: false, SERVER_MODE: true },
    });
    expect(result).toMatchSnapshot();
});
