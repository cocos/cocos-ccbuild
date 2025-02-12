import testAsm from 'external:wasm/emscripten/meshopt/meshopt_decoder.asm.js';
import testWasm from 'external:wasm/emscripten/meshopt/meshopt_decoder.wasm.js';
import wasmUrl from 'external:wasm/emscripten/meshopt/meshopt_decoder.wasm.wasm';
import { CULL_MESHOPT } from 'internal:constants';

if (CULL_MESHOPT) {
    console.log('>>> CULL_MESHOPT is true');
} else {
    console.log('>>> CULL_MESHOPT is false');
}

export { testAsm, testWasm, wasmUrl };