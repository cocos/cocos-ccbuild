import { WASM_FALLBACK, WASM_SUPPORT_MODE } from 'internal:constants';
import { isSupportWASM } from './is-support-wasm';
import wasmUrl from 'external:wasm/emscripten/wasm_c.wasm';
import wasmFactory from 'external:wasm/emscripten/wasm_c.wasm.js';
import asmFactory from 'external:wasm/emscripten/wasm_c.asm.js';
import asmJsMemUrl from 'external:wasm/emscripten/wasm_c.js.mem';


function initializeWasm (): Promise<any> {
    return new Promise((resolve, reject) => {
        if (WASM_FALLBACK) {
            Promise.all([import('external:wasm/emscripten/wasm_c.wasm.fallback'), import('external:wasm/emscripten/wasm_c.wasm.fallback.js')]).then(([
                { default: wasmFallbackUrl },
                { default: wasmFallbackFactory },
            ]) => {
                return wasmFallbackFactory({
                    locateFile(_) {
                        return wasmFallbackUrl;
                    }
                }).then(inst => {
                    resolve(inst);
                }).catch(reject);
            });
            return;
        }
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
        asmFactory({
            memoryInitializerRequest: {
                response: asmJsMemUrl,  // this should be fs.readFileSync(asmJsMemUrl)
                status: 200,
            } as Partial<XMLHttpRequest>
        }).then(inst => {
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
