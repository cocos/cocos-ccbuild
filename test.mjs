import * as ccbuild from './lib/index.js';
import * as ps from 'path';
import { fileURLToPath } from 'url';
const __dirname = ps.dirname(fileURLToPath(import.meta.url));

const engineRoot = 'c:/Users/pp/Desktop/cocos-editor/resources/3d/engine';

const engineBuilder = new ccbuild.EngineBuilder();
await engineBuilder.build({
    root: engineRoot,
    features: ['audio', 'animation'],
    platform: 'NATIVE',
    mode: 'BUILD',
    flagConfig: {
        DEBUG: true,
    },
    outDir: ps.join(engineRoot, './lib').replace(/\\/g, '/'),
});