import testAsm from 'external:wasm/emscripten/meshopt/meshopt_decoder.asm.js';
import testWasm from 'external:wasm/emscripten/meshopt/meshopt_decoder.wasm.js';
import wasmUrl from 'external:wasm/emscripten/meshopt/meshopt_decoder.wasm.wasm';
import { CULL_MESHOPT } from 'internal:constants';

console.log(CULL_MESHOPT);

export { testAsm, testWasm, wasmUrl };