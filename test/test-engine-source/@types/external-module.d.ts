declare module 'external:*.wasm' {
    const wasmPath: string;
    export default wasmPath;
}

declare module 'external:*.js.mem' {
    const jsMemPath: string;
    export default jsMemPath;
}


declare module 'external:*.wasm.fallback' {
    const wasmFallbackPath: string;
    export default wasmFallbackPath;
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

declare module 'external:wasm/emscripten/meshopt/meshopt_decoder.asm.js' {
    namespace MeshoptDecoder {
        const supported: boolean;
        const ready: Promise<void>;

        function decodeVertexBuffer (target: Uint8Array, count: number, size: number, source: Uint8Array, filter?: string): void;
        function decodeIndexBuffer (target: Uint8Array, count: number, size: number, source: Uint8Array): void;
        function decodeIndexSequence (target: Uint8Array, count: number, size: number, source: Uint8Array): void;

        function decodeGltfBuffer (target: Uint8Array, count: number, size: number, source: Uint8Array, mode: string, filter?: string): void;

        function useWorkers (count: number): void;
        function decodeGltfBufferAsync (count: number, size: number, source: Uint8Array, mode: string, filter?: string): Promise<Uint8Array>;
    }

    export default MeshoptDecoder;
}

declare module 'external:wasm/emscripten/meshopt/meshopt_decoder.wasm.js' {
    namespace MeshoptDecoder {
        const supported: boolean;
        const ready: (instantiateWasm: any) => Promise<void>;

        function decodeVertexBuffer (target: Uint8Array, count: number, size: number, source: Uint8Array, filter?: string): void;
        function decodeIndexBuffer (target: Uint8Array, count: number, size: number, source: Uint8Array): void;
        function decodeIndexSequence (target: Uint8Array, count: number, size: number, source: Uint8Array): void;

        function decodeGltfBuffer (target: Uint8Array, count: number, size: number, source: Uint8Array, mode: string, filter?: string): void;

        function useWorkers (count: number): void;
        function decodeGltfBufferAsync (count: number, size: number, source: Uint8Array, mode: string, filter?: string): Promise<Uint8Array>;
    }

    export default MeshoptDecoder;
}
