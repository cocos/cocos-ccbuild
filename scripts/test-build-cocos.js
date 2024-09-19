const ps = require('path');
const { ensureDir, emptyDir } = require('fs-extra');
const { buildEngine } = require('../lib/src');

const argv = process.argv;

(async function exec () {
    if (argv.length <= 2) {
        console.error(`Usages: node test-build-cocos.js cocos_engine_absolute_path`);
        return;
    }

    const enginePath = argv[2];
    console.info(`>>> enginePath: ${enginePath}`);

    const outDir = ps.join(__dirname, '..', 'build-cc-out');

    const options = {
        "engine": enginePath,
        "out": outDir,
        "platform": "WECHAT",
        "moduleFormat": "system",
        "compress": true,
        "split": false,
        "nativeCodeBundleMode": "wasm",
        "assetURLFormat": "relative-from-out",
        "noDeprecatedFeatures": true,
        "sourceMap": false,
        // "features": ["2d", "3d", "animation", "audio", "base", "debug-renderer", "dragon-bones", "geometry-renderer", "gfx-webgl", "intersection-2d", "legacy-pipeline", "light-probe", "particle", "particle-2d", "physics-2d-builtin", "physics-cannon", "primitive", "profiler", "skeletal-animation", "spine", "terrain", "tiled-map", "tween", "ui", "video", "websocket", "webview"],
        "features":["gfx-webgl2"],
        "loose": true,
        "mode": "BUILD",
        "flags": {
            "DEBUG": false,
            "WEBGPU": false
        },
        // "metaFile": ps.join(outDir, "meta.json"),
        // "incremental": ps.join(outDir, "watch-files.json"),
        "wasmCompressionMode": false,
        "visualize": true,
        "inlineEnum": true,
    };

    await ensureDir(outDir);
    await emptyDir(outDir);

    await buildEngine(options);
}());
