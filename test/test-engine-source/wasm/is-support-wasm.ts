// refer https://stackoverflow.com/questions/47879864/how-can-i-check-if-a-browser-supports-webassembly
export const isSupportWASM = (() => {
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