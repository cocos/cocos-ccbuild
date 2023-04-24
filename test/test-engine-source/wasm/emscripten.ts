import wasmUrl from 'external:///wasm/emscripten/wasm_c.wasm';
import factory from 'external:///wasm/emscripten/wasm_c.js';

import factory from 'external:///wasm/emscripten/wasm_c.asm.js';

factory({
    locateFile(_) {
        return wasmUrl;
    }
}).then(inst => {
    inst._hello();
});