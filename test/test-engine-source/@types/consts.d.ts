/**
 * This is an auto-generated declaration file for constants internally used in engine.
 * You may regenerate it by running cli command `npm run build-const`.
 */

declare module 'internal:constants'{
    /**
     * Running in Web platform
     */
    export const HTML5: boolean;

    /**
     * Running in native platform (mobile app, desktop app, or simulator).
     */
    export const NATIVE: boolean;

    /**
     * Running in ANDROID platform
     */
    export const ANDROID: boolean;

    /**
     * Running in IOS platform
     */
    export const IOS: boolean;

    /**
     * Running in MAC platform
     */
    export const MAC: boolean;

    /**
     * Running in WINDOWS platform
     */
    export const WINDOWS: boolean;

    /**
     * Running in LINUX platform
     */
    export const LINUX: boolean;

    /**
     * Running in OHOS platform
     */
    export const OHOS: boolean;

    /**
     * Running in OPEN_HARMONY platform
     */
    export const OPEN_HARMONY: boolean;

    /**
     * Running in the Wechat's mini game.
     */
    export const WECHAT: boolean;

    /**
     * Running in the Wechat's mini program.
     */
    export const WECHAT_MINI_PROGRAM: boolean;

    /**
     * Running in the baidu's mini game.
     */
    export const BAIDU: boolean;

    /**
     * Running in the xiaomi's quick game.
     */
    export const XIAOMI: boolean;

    /**
     * Running in the alipay's mini game.
     */
    export const ALIPAY: boolean;

    /**
     * Running in the taobao creative app.
     */
    export const TAOBAO: boolean;

    /**
     * Running in the taobao mini game.
     */
    export const TAOBAO_MINIGAME: boolean;

    /**
     * Running in the ByteDance's mini game.
     */
    export const BYTEDANCE: boolean;

    /**
     * Running in the oppo's quick game.
     */
    export const OPPO: boolean;

    /**
     * Running in the vivo's quick game.
     */
    export const VIVO: boolean;

    /**
     * Running in the huawei's quick game.
     */
    export const HUAWEI: boolean;

    /**
     * Running in the cocosplay.
     */
    export const COCOSPLAY: boolean;

    /**
     * Running in the qtt's quick game.
     */
    export const QTT: boolean;

    /**
     * Running in the linksure's quick game.
     */
    export const LINKSURE: boolean;

    /**
     * Running in the editor.
     */
    export const EDITOR: boolean;

    /**
     * Preview in browser or simulator.
     */
    export const PREVIEW: boolean;

    /**
     * Running in published project.
     */
    export const BUILD: boolean;

    /**
     * Running in the engine's unit test.
     */
    export const TEST: boolean;

    /**
     * Running debug mode.
     */
    export const DEBUG: boolean;

    /**
     * Running in the server mode.
     */
    export const SERVER_MODE: boolean;

    /**
     * Running in the editor or preview.
     */
    export const DEV: boolean;

    /**
     * Running in mini game.
     */
    export const MINIGAME: boolean;

    /**
     * Running in runtime based environment.
     */
    export const RUNTIME_BASED: boolean;

    /**
     * Support JIT.
     */
    export const SUPPORT_JIT: boolean;

    /**
     * Running in environment where using JSB as the JavaScript interface binding scheme.
     */
    export const JSB: boolean;

    /**
     * This is an internal constant to determine whether pack physx libs.
     */
    export const NOT_PACK_PHYSX_LIBS: boolean;

    /**
     * The network access mode.
     * - 0 Client
     * - 1 ListenServer
     * - 2 HostServer
     */
    export const NET_MODE: number;

    /**
     * Running with webgpu rendering backend.
     */
    export const WEBGPU: boolean;

    /**
     * Whether support wasm, here we provide 3 options:
     * 0: The platform doesn't support WASM
     * 1: The platform supports WASM
     * 2: The platform may support WASM, especially on Web platform
     */
    export const WASM_SUPPORT_MODE: number;

    /**
     * Whether force banning using bullet wasm and use asmjs instead.
     */
    export const FORCE_BANNING_BULLET_WASM: boolean;

    /**
     * An internal constant to indicate whether need a fallback of wasm.
     * If true, we build a wasm fallback module for the compatibility of wasm files compiled by different version of emscripten.
     * This is useful when we use wasm on different version of Safari browsers.
     */
    export const WASM_FALLBACK: boolean;

    /**
     * An internal constant to indicate whether we cull the meshopt wasm module and asm.js module.
     */
    export const CULL_MESHOPT: boolean;
}
