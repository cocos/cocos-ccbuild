const ps = require('path');
const { ensureDir, emptyDir } = require('fs-extra');
const { magenta } = require('chalk');

const { buildEngine } = require('../lib/src');

const prefix = ''.padStart(20, '=');
console.log(magenta(`${prefix} Build H5 source ${prefix}`));



(async function exec () {
    const outDir = ps.join(__dirname, '..', 'build-cc-out');

    const options = {
        "engine": "/Users/james/projects/cocos-creator/cocos-editor-3/resources/3d/engine",
        "out": outDir,
        "platform": "WECHAT",
        "moduleFormat": "system",
        "compress": true,
        "split": false,
        "nativeCodeBundleMode": "wasm",
        "assetURLFormat": "relative-from-out",
        "noDeprecatedFeatures": true,
        "sourceMap": false,
        // "features":["2d","base","gfx-webgl","legacy-pipeline","profiler","tween","ui"],
        "features":["gfx-webgl"],
        "loose": true,
        "mode": "BUILD",
        "flags": {
            "DEBUG": false,
        },
        // "metaFile": ps.join(outDir, "meta.json"),
        // "incremental": ps.join(outDir, "watch-files.json"),
        "wasmCompressionMode": false,
        "visualize": true,
    }

    await ensureDir(outDir);
    await emptyDir(outDir);

    await buildEngine(options);
}());
