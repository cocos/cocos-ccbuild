import wasmUrl from 'external://wasm/wasm-pack/wasm_rust.wasm';
import init from 'external:///wasm/wasm-pack/wasm_rust.js'

init(wasmUrl).then(inst => {
    inst.greet();
});