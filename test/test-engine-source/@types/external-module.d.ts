declare module 'external:*.wasm' {
    const wasmPath: string;
    export default wasmPath;
}

declare module 'external:*.js.mem' {
    const jsMemPath: string;
    export default jsMemPath;
}

declare module 'external:wasm/emscripten/wasm_c.*js' {
    function factory (options?: {
        locateFile? (wasmPath: string, scriptDirectory?: string): string;
        memoryInitializerRequest?: Partial<XMLHttpRequest>;
    }): Promise<any>;

    export default factory; 
}

declare module 'external:wasm/wasm-pack/wasm_rust.js' {
    function init (input: string): Promise<any>;
    export default init;
}