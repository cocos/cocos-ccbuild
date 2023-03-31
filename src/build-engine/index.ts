import { StatsQuery } from "../stats-query";
import { buildJsEngine } from "./engine-js";

function verifyCache (options: buildEngine.Options): boolean {
    // TODO
    return false;
}

export async function buildEngine (options: buildEngine.Options): Promise<buildEngine.Result> {
    if (verifyCache(options)) {
        throw 'TODO';
    }
    if (options.platform === 'OPEN_HARMONY') {
        // we use a custom engine builder for OPEN_HARMONY platform
        throw 'TODO';
    } else {
        return buildJsEngine(options);
    }
}

export namespace buildEngine {
    export type ModuleFormat = 'esm' | 'cjs' | 'system' | 'iife';
    
    export interface Options {
        /**
         * 引擎仓库目录。
         */
        engine: string;

        /**
         * 输出目录。
         */
        out: string;

        // TODO: should we provide IModeConfig because sometimes engine executes in multiple modes such as EDITOR and PREVIEW mode.
        mode: StatsQuery.ConstantManager.ModeType;

        platform: StatsQuery.ConstantManager.PlatformType;

        flags?: Partial<StatsQuery.ConstantManager.IFlagConfig>;

        /**
         * 包含的功能。
         */
        features?: string[];

        /**
         * 输出模块格式。
         * @default 'system'
         */
        moduleFormat?: ModuleFormat;

        /**
         * 是否对生成结果进行压缩。
         * @default false
         */
        compress?: boolean;

        /**
         * 是否生成 source map。
         * 若为 `inline` 则生成内联的 source map。
         * @default false
         */
        sourceMap?: boolean | 'inline';

        /**
         * 若 `sourceMap` 为 `true`，此选项指定了 source map 的路径。
         * @default `${outputPath.map}`
         */
        sourceMapFile?: string;

        /**
         * 若为 `true`，分割出 **所有** 引擎子模块。
         * 否则，`.moduleEntries` 指定的所有子模块将被合并成一个单独的 `"cc"` 模块。
         * @default false
         */
        split?: boolean;

        /**
         * 使用的 ammo.js 版本，也即 `@cocos/ammo` 映射到的版本。
         * - 为 `true` 时使用 WebAssembly 版本的 ammo.js；
         * - 为 `false` 时使用 asm.js 版本的 ammo.js；
         * - 为 `'fallback` 时同时在结果中包含两个版本的 ammo.js，并自动根据环境 fallback 选择。
         *
         * 注意，`'fallback'` 只有在 SystemJS 和 Async functions 同时支持时才有效。
         * @default false
         */
        ammoJsWasm?: boolean | 'fallback';

        /**
         * If true, all deprecated features/API are excluded.
         * You can also specify a version range(in semver range) to exclude deprecations in specified version(s).
         * @default false
         */
        noDeprecatedFeatures?: string | boolean;

        /**
         * Experimental.
         */
        incremental?: string;

        // progress?: boolean;

        /**
         * BrowsersList targets.
         */
        targets?: string | string[] | Record<string, string>;

        /**
         * Enable loose compilation.
         */
        loose?: boolean;

        /**
         * How to generate the reference to external assets:
         * - `'relative-from-out'`
         * Generate the path relative from `out` directory, does not contain the leading './'.
         *
         * - `'relative-from-chunk'`
         * Generate the path relative from the referencing output chunk.
         *
         * - `'dynamic'`(default)
         * Use runtime `URL` API to resolve the absolute URL.
         * This requires `URL` and `import.meta.url` to be valid.
         */
        assetURLFormat?: 'relative-from-out' | 'relative-from-chunk' | 'runtime-resolved';

        // visualize?: boolean | {
        //     file?: string;
        // };

        // buildTimeConstants: IBuildTimeConstants;

        // /**
        //  * Generate cocos/native-binding/decorators.ts for native platforms
        //  */
        // generateDecoratorsForJSB?: boolean;

        // /**
        //  * Whether force SUPPORT_JIT to the specified value.
        //  */
        // forceJitValue?: boolean,
    }

    export interface Result {
        /**
         * Mappings between feature unit name and their actual chunk file, for example:
         * ```js
         * {
         *   "core": "./core.js",
         *   "gfx-webgl": "./gfx-webgl.js",
         * }
         * ```
         */
        exports: Record<string, string>;

        /**
         * The compulsory import mappings that should be applied.
         */
        chunkAliases: Record<string, string>;

        dependencyGraph?: Record<string, string[]>;

        hasCriticalWarns: boolean;
    }
}