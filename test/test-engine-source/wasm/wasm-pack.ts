import { NATIVE_CODE_BUNDLE_MODE } from 'internal:constants';
import wasmUrl from 'external:wasm/wasm-pack/wasm_rust.wasm';
import init from 'external:wasm/wasm-pack/wasm_rust.js';
import { isSupportWASM } from './is-support-wasm';
import { MyEnum } from './emscripten';

if (NATIVE_CODE_BUNDLE_MODE === 1) {
    init(wasmUrl).then(inst => {
        inst.greet();
    });
} else if (NATIVE_CODE_BUNDLE_MODE === 2) {
    if (isSupportWASM) {
        init(wasmUrl).then(inst => {
            inst.greet();
        });
    }
}

export enum MyEnum4 {
    AAABBB,
    Haha = MyEnum.AAA,
    Hi = MyEnum.CCC,
}
