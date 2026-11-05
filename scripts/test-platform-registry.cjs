/* Run: node scripts/test-platform-registry.cjs [editor checkout with installed dependencies] */
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert').strict;
const Module = require('module');
const root = path.resolve(__dirname, '..');
const editor = process.argv[2] && path.resolve(process.argv[2]);
const deps = Module.createRequire(editor ? path.join(editor, 'app/node_modules/@cocos/ccbuild/package.json') : path.join(root, 'package.json'));
const ts = editor ? require(path.join(editor, 'node_modules/typescript')) : require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...rest) {
    if (name.startsWith('@ccbuild/')) {
        const pkg = name.slice('@ccbuild/'.length);
        if (['modularize', 'stats-query', 'build-engine'].includes(pkg)) { return path.join(root, 'modules', pkg, 'src/index.ts'); }
        if (editor) { return path.join(editor, 'app/node_modules/@cocos/ccbuild/modules', pkg, 'lib/index.js'); }
    }
    try { return resolve.call(this, name, parent, ...rest); }
    catch (error) {
        if (name.startsWith('.') || path.isAbsolute(name)) { throw error; }
        return deps.resolve(name);
    }
};
require.extensions['.ts'] = (mod, file) => {
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, reportDiagnostics: true,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
    const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: x => x, getCurrentDirectory: () => root, getNewLine: () => '\n' }));
    mod._compile(result.outputText, file);
};
const registry = require('../modules/modularize/src/platform-registry.ts');
const { ModuleQuery } = require('../modules/modularize/src/module-query.ts');
const { StatsQuery } = require('../modules/stats-query/src/index.ts');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ccbuild-platform-'));
const write = (file, value) => { fs.mkdirSync(path.dirname(path.join(temp, file)), { recursive: true }); fs.writeFileSync(path.join(temp, file), JSON.stringify(value)); };
(async () => {
    write('package.json', { workspaces: ['pal'] });
    write('pal/package.json', { name: '@test/pal', exports: { '.': { types: './types.ts', web: { default: './web.ts' }, minigame: { default: './mini.ts', CUSTOM_GAME: './wrong.ts', custom_game: './custom.ts' }, native: './native.ts' } } });
    write('cc.config.json', { constants: {
        BUILD: { comment: 'fixture', type: 'boolean', value: false, internal: true },
        HTML5: { comment: 'fixture', type: 'boolean', value: false, internal: false },
        MINIGAME: { comment: 'fixture', type: 'boolean', value: false, internal: false },
        NATIVE: { comment: 'fixture', type: 'boolean', value: false, internal: false },
        WECHAT: { comment: 'fixture', type: 'boolean', value: false, internal: false }
    } });
    const defs = [{ id: 'CUSTOM_GAME', category: 'minigame' }, { id: 'CUSTOM_WEB', category: 'web' }, { id: 'CUSTOM_NATIVE', category: 'native' }, { id: 'OTHER_GAME', category: 'minigame' }];
    assert.throws(() => registry.registerPlatformDefinitions([{ id: 'WECHAT', category: 'web' }]), /built-in/);
    assert.throws(() => registry.registerPlatformDefinitions([{ id: '../BAD', category: 'web' }]), /Invalid/);
    await registry.withPlatformDefinitions(defs, async () => {
        for (const [platform, entry, category] of [['CUSTOM_GAME', 'custom.ts', 'MINIGAME'], ['OTHER_GAME', 'mini.ts', 'MINIGAME'], ['CUSTOM_WEB', 'web.ts', 'HTML5'], ['CUSTOM_NATIVE', 'native.ts', 'NATIVE']]) {
            assert.equal(path.basename(await new ModuleQuery({ engine: temp, platform }).resolveExport('@test/pal')), entry);
            const cm = new StatsQuery.ConstantManager(temp);
            const values = cm.genCCEnvConstants({ platform, mode: 'BUILD', flags: {} });
            assert.equal(values[platform], true);
            assert.equal(values[category], true);
            assert.equal(values.WECHAT, false);
            assert.match(cm.genCCEnv(), /CUSTOM_GAME/);
            assert.match(cm.exportStaticConstants({ platform, mode: 'BUILD', flags: {} }), new RegExp(platform + ' = true'));
        }
        assert.equal(path.basename(await new ModuleQuery({ engine: temp, platform: 'WECHAT' }).resolveExport('@test/pal')), 'mini.ts');
        await assert.rejects(new ModuleQuery({ engine: temp, platform: 'MISSING' }).resolveExport('@test/pal'), /Unknown platform/);
    });
    await registry.withPlatformDefinitions([{ id: 'CUSTOM_RUNTIME', category: 'minigame', runtimeMode: 'runtime', moduleOverrides: { 'pal/minigame': 'pal/minigame/runtime.js' } }], async () => {
        const cm = new StatsQuery.ConstantManager(temp);
        const values = cm.genCCEnvConstants({ platform: 'CUSTOM_RUNTIME', mode: 'BUILD', flags: {} });
        assert.equal(values.RUNTIME_BASED, true);
        assert.equal(values.MINIGAME, false);
        assert.equal(values.CUSTOM_RUNTIME, true);
        assert.equal(path.basename(await new ModuleQuery({ engine: temp, platform: 'CUSTOM_RUNTIME' }).resolveExport('@test/pal')), 'mini.ts');
        const query = await StatsQuery.create(path.join(root, 'test/test-engine-source'));
        const overrides = query.evaluateModuleOverrides({ platform: 'CUSTOM_RUNTIME', buildTimeConstants: values });
        assert.equal(overrides['pal/minigame'], path.resolve(root, 'test/test-engine-source/pal/minigame/runtime.js'));
    });
    assert.throws(() => registry.validatePlatformDefinitions([{ id: 'BAD_MODE', category: 'native', runtimeMode: 'runtime' }]), /runtimeMode/);
    assert.throws(() => registry.validatePlatformDefinitions([{ id: 'BAD_PATH', category: 'minigame', moduleOverrides: { 'pal/env': '../outside.js' } }]), /PAL override/);
    assert.equal(registry.getPlatformDefinitions().length, 0);
    await Promise.all(defs.slice(0, 2).map(def => registry.withPlatformDefinitions([def], async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        assert.deepEqual(registry.getPlatformDefinitions(), [def]);
    })));
    registry.registerPlatformDefinitions([defs[0]]);
    assert.throws(() => registry.registerPlatformDefinitions([{ ...defs[0], category: 'web' }]), /Conflicting/);
    assert.deepEqual(registry.getPlatformDefinitions(), [defs[0]]);
    if (process.env.CCBUILD_TEST_ENGINE === '1') {
        const { buildEngine } = require('../modules/build-engine/src/index.ts');
        const result = await buildEngine({ engine: path.join(root, 'test/test-engine-source'), out: path.join(temp, 'engine-output'), features: ['animation'], platform: 'CUSTOM_GAME', platformDefinitions: defs, mode: 'BUILD', moduleFormat: 'esm', compress: false, split: false });
        assert.ok(Object.keys(result.exports).length);
        console.log('PASS: actual engine fixture build using CUSTOM_GAME');
    }
    if (editor) {
        // Load editor code against the changed ccbuild source, not the old installed registry.
        const load = Module._load;
        Module._load = function (name, ...args) { if (name === '@cocos/ccbuild') { return { Modularize: require('../modules/modularize/src/index.ts') }; } return load.call(this, name, ...args); };
        const manifest = require(path.join(editor, 'app/builtin/builder/source/share/platform-manifest.ts'));
        const platforms = require(path.join(editor, 'app/builtin/builder/source/share/platforms-options.ts'));
        const definition = { schemaVersion: 1, id: 'custom-game', label: 'Custom game', category: 'minigame', enginePlatform: 'CUSTOM_GAME', engine: defs[0], hostOS: ['darwin'], groups: ['overseas'], order: 1 };
        assert.throws(() => manifest.validatePlatformManifest(definition, 'different-package'), /Invalid/);
        assert.throws(() => manifest.validatePlatformManifest({ ...definition, groups: ['bad'] }, definition.id), /groups/);
        write('plugin/platform.json', definition);
        assert.deepEqual(manifest.readPlatformManifest(path.join(temp, 'plugin'), 'platform.json', definition.id), definition);
        assert.throws(() => manifest.readPlatformManifest(path.join(temp, 'plugin'), '../cc.config.json', definition.id), /inside/);
        platforms.registerPlatformManifest(definition);
        platforms.registerPlatformManifest(JSON.parse(JSON.stringify(definition)));
        assert.equal(platforms.PLATFORMS.filter(x => x === definition.id).length, 1);
        assert.equal(platforms.categorizePlatform(definition.id), 'game');
        assert.deepEqual(platforms.getPlatformGroup(definition.id), ['overseas']);
        assert.equal(platforms.isHiddenByOS(definition.id), process.platform !== 'darwin');
        assert.throws(() => platforms.registerPlatformManifest({ ...definition, id: 'android' }), /existing/);
        assert.ok(platforms.getPlatformGroupOrder('overseas').includes(definition.id));
        const pluginRoot = path.join(temp, 'builtin-extensions', 'test-version', definition.id);
        write('builtin-extensions/test-version/' + definition.id + '/platform.json', definition);
        fs.writeFileSync(path.join(pluginRoot, 'builder.js'), "exports.configs = { 'custom-game': { commonOptions: {}, options: {} } };");
        const pkg = { name: definition.id, path: pluginRoot, version: '1.0.0', info: { creator: { builder: { internal: true, platform: true, platformManifest: './platform.json' } }, contributions: { builder: './builder.js' } } };
        let features = {};
        global.Editor = {
            App: { home: temp, version: 'test-version', path: path.join(temp, 'app'), dev: true },
            Utils: { Path: { contains: (root, file) => { const rel = path.relative(root, file); return !rel.startsWith('..') && !path.isAbsolute(rel); } } },
            Package: { getPackages: () => [pkg], __protected__: { on() {}, removeListener() {} } },
            Profile: { getConfig: async () => features },
            Module: { __protected__: { requireFile: file => require(file) } },
            Logger: { __protected__: { record() {} } },
            I18n: { t: x => x }
        };
        const beforeManagerLoad = Module._load;
        Module._load = function(name, parent, ...args) {
            if (parent?.filename.endsWith(path.join('share', 'plugin-manager.ts'))) {
                if (name.includes('common-options-validator')) { return { commonOptionConfigs: {} }; }
                if (name.includes('validator-manager')) { return {}; }
                if (name === './utils') { return { resolveToRaw: (file, root) => path.resolve(root, file) }; }
            }
            return beforeManagerLoad.call(this, name, parent, ...args);
        };
        const { PluginManagerBase } = require(path.join(editor, 'app/builtin/builder/source/share/plugin-manager.ts'));
        const manager = new PluginManagerBase();
        await manager.init();
        assert.equal(manager.platformInfoMap[definition.id].label, definition.label);
        assert.equal(require(path.join(pluginRoot, 'builder.js')).configs[definition.id].platformType, definition.enginePlatform);
        assert.equal(manager.packageRegisterInfo.get(definition.id).internal, true);
        features = { [definition.id]: false };
        const disabledManager = new PluginManagerBase();
        await disabledManager.init();
        assert.equal(disabledManager.packageRegisterInfo.has(definition.id), false);
        await manager.destroy();
        await disabledManager.destroy();
        Module._load = beforeManagerLoad;
        console.log('PASS: real plugin manager discovers platform.json, injects engine mapping and honors feature disable');
        const mangle = require(path.join(editor, 'app/builtin/builder/source/worker/builder/asset-handler/script/mangle-config-parser.ts'));
        write('mangle.json', { COMMON: { mangleList: ['foo'] }, MINIGAME: { extends: 'COMMON' } });
        assert.deepEqual(mangle.parseMangleConfig(path.join(temp, 'mangle.json'), 'CUSTOM_GAME', 'MINIGAME').mangleList, ['foo']);
    }
    console.log('PASS: custom web/minigame/native resolution, fallback, constants, declarations, built-in compatibility, concurrent isolation, conflicts and editor JSON registration');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
    // Only the mkdtemp-created test directory is removed.
    assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('ccbuild-platform-'));
    fs.rmSync(temp, { recursive: true, force: true });
});
