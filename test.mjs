import * as ccbuild from './lib/index.js';
import * as ps from 'path';
import { fileURLToPath } from 'url';
const __dirname = ps.dirname(fileURLToPath(import.meta.url));

const engineRoot = 'c:/Users/pp/Desktop/cocos-editor/resources/3d/engine';

const engineBuilder = new ccbuild.EngineBuilder();
await engineBuilder.build({
    root: engineRoot,
    entries: [
        ps.join(engineRoot, './exports/2d.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/3d.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/animation.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/audio.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/base.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/custom-pipeline.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/dragon-bones.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/geometry-renderer.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/gfx-empty.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/gfx-webgl.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/gfx-webgl2.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/intersection-2d.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/light-probe.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/particle-2d.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/particle.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-2d-box2d.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-2d-builtin.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-2d-framework.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-ammo.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-builtin.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-cannon.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-framework.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/physics-physx.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/primitive.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/profiler.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/skeletal-animation.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/sorting.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/spine.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/terrain.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/tiled-map.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/tween.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/ui.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/video.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/wait-for-ammo-instantiation.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/webview.ts').replace(/\\/g, '/'),
        ps.join(engineRoot, './exports/xr.ts').replace(/\\/g, '/'),
    ],
    platform: 'OPEN_HARMONY',
    flagConfig: {
        DEBUG: true,
    },
    outDir: ps.join(engineRoot, './lib').replace(/\\/g, '/'),
    virtualModule: {
        'internal:constants': 'export const TEST = true;\nexport const EDITOR = false;'
    },
});