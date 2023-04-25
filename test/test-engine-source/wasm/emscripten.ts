import { WASM_SUPPORT_MODE } from 'internal:constants';
import { isSupportWASM } from './is-support-wasm';

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
    if (isSupportWASM) {
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
