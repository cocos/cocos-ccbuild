import { WASM_SUPPORT_MODE } from 'internal:constants';

function dynamicImportWASM (): Promise<any> {
    return new Promise((resolve, reject) => {
        import('external:///wasm/emscripten/wasm_c.wasm').then(({
            default: wasmUrl
        }) => {
            return import('external:///wasm/emscripten/wasm_c.js').then(({default: factory}) => {
                factory({
                    locateFile(_) {
                        return wasmUrl;
                    }
                }).then(inst => {
                    resolve(inst);
                });
            });
        }).catch(reject);
    })
}

function dynamicImportASM (): Promise<any> {
    return new Promise((resolve, reject) => {
        import('external:///wasm/emscripten/wasm_c.asm.js').then(({default: factory}) => {
            factory().then(inst => {
                resolve(inst);
            });
        }).catch(reject);
    });
}

if (WASM_SUPPORT_MODE === 1) {
    dynamicImportWASM().then(inst => {
        inst._hello();
    });
} else if (WASM_SUPPORT_MODE === 2) {
    // refer https://stackoverflow.com/questions/47879864/how-can-i-check-if-a-browser-supports-webassembly
    const supported = (() => {
        try {
            if (typeof WebAssembly === 'object'
                && typeof WebAssembly.instantiate === 'function') {
                const module = new WebAssembly.Module(new Uint8Array([0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
                if (module instanceof WebAssembly.Module) {
                    return !!(new WebAssembly.Instance(module) instanceof WebAssembly.Instance);
                }
            }
        } catch (e) {
            return false;
        }
        return false;
    })();
    if (supported) {
        dynamicImportWASM().then(inst => {
            inst._hello();
        });
    } else {
        dynamicImportASM().then(inst => {
            inst._hello();
        });
    }
} else {
    dynamicImportASM().then(inst => {
        inst._hello();
    });
}
