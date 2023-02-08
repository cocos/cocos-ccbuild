import * as ccbuild from './lib/index.js';
import * as ps from 'path';
import { fileURLToPath } from 'url';
const __dirname = ps.dirname(fileURLToPath(import.meta.url));

const engineRoot = 'c:/Users/pp/Desktop/cocos-editor-legacy/resources/3d/engine';

const engineBuilder = new ccbuild.EngineBuilder();
await engineBuilder.build({
    root: engineRoot,
    features: [
        "base",
        "gfx-webgl",
        "gfx-webgl2",
        "3d",
        "animation",
        "skeletal-animation",
        "2d",
        "ui",
        "particle",
        "particle-2d",
        "physics-framework",
        // "physics-cannon",
        // "physics-physx",
        // "physics-ammo",
        "physics-builtin",
        // "physics-2d-framework",
        // "physics-2d-box2d",
        // "physics-2d-builtin",
        "intersection-2d",
        "primitive",
        "profiler",
        // "occlusion-query",
        // "geometry-renderer",
        // "debug-renderer",
        "audio",
        "video",
        // "xr",
        // "terrain",
        "webview",
        "tween",
        // "tiled-map",
        // "spine",
        // "dragon-bones",
        // "marionette",
        "custom-pipeline",
    ],
    platform: 'NATIVE',
    mode: 'BUILD',
    flagConfig: {
        DEBUG: true,
    },
    outDir: ps.join(engineRoot, './lib').replace(/\\/g, '/'),
});