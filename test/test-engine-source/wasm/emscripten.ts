import { WASM_SUPPORT_MODE } from 'internal:constants';
import { isSupportWASM } from './is-support-wasm';
import wasmUrl from 'external:///wasm/emscripten/wasm_c.wasm';
import wasmFactory from 'external:///wasm/emscripten/wasm_c.js';
import asmFactory from 'external:///wasm/emscripten/wasm_c.asm.js';


function initializeWasm (): Promise<any> {
    return new Promise((resolve, reject) => {
        wasmFactory({
            locateFile(_) {
                return wasmUrl;
            }
        }).then(inst => {
            resolve(inst);
        }).catch(reject);
    });
}

function initializeAsm (): Promise<any> {
    return new Promise((resolve, reject) => {
        asmFactory().then(inst => {
            resolve(inst);
        }).catch(reject);
    });
}

if (WASM_SUPPORT_MODE === 1) {
    initializeWasm().then(inst => {
        inst._hello();
    });
} else if (WASM_SUPPORT_MODE === 2) {
    if (isSupportWASM) {
        initializeWasm().then(inst => {
            inst._hello();
        });
    } else {
        initializeAsm().then(inst => {
            inst._hello();
        });
    }
} else {
    initializeAsm().then(inst => {
        inst._hello();
    });
}
