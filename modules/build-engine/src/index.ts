import { StatsQuery } from '@ccbuild/stats-query';
import { buildJsEngine } from './engine-js';
import { babel } from '@ccbuild/transformer';
import fs from 'fs-extra';
import { buildTsEngine } from './engine-ts';

function verifyCache (options: buildEngine.Options): boolean {
	// TODO
	return false;
}

function applyDefaultOptions (options: buildEngine.Options): void {
    options.preserveType ??= false;
    options.loose = true;  // force using true
    if (!options.flags) {
        options.flags = {};
    }
    switch (options.nativeCodeBundleMode) {
        case 'asmjs':
            options.flags.NATIVE_CODE_BUNDLE_MODE = 0;
            break;
        case 'wasm':
            options.flags.NATIVE_CODE_BUNDLE_MODE = 1;
            break;
        default:
            options.flags.NATIVE_CODE_BUNDLE_MODE = 2;
            break;
    }
}

function moduleOptionsToBabelEnvModules(moduleOptions: buildEngine.ModuleFormat): false | 'commonjs' | 'amd' | 'umd' | 'systemjs' | 'auto' {
    switch (moduleOptions) {
    case 'cjs': return 'commonjs';
    case 'system': return 'systemjs';
    case 'iife':
    case 'esm': return false;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    default: throw new Error(`Unknown module format ${moduleOptions}`);
    }
}

/**
 * @group Merged Types
 */
export async function buildEngine (options: buildEngine.Options): Promise<buildEngine.Result> {
	applyDefaultOptions(options);

	if (verifyCache(options)) {
		throw 'TODO';
	}

	if (options.platform === 'OPEN_HARMONY') {
		if (options.preserveType) {
			// we use a custom engine builder for OPEN_HARMONY platform when enable preserveType option.
			return buildTsEngine(options);
		} else {
			return buildJsEngine(options as Required<buildEngine.Options>);
		}
	} else {
		if (options.preserveType) {
			console.warn(`Currently we haven't support building ts engine on the platform ${options.platform}`);
		}
		return buildJsEngine(options as Required<buildEngine.Options>);
	}
}

/**
 * @group Merged Types
 */
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
         * 是否对生成的脚本进行压缩。
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
         * 原生代码的打包模式
         * - 为 `wasm` 时使用 wasm 版本原生库
         * - 为 `asmjs` 时使用 asmjs 版本的原生库
         * - 为 `both` 时同时在结果中包含 wasm 与 asmjs 两个版本的原生库
         */
        nativeCodeBundleMode?: 'wasm' | 'asmjs' | 'both';

        /**
         * Wasm compression mode, 'brotli' means to compress .wasm to .wasm.br.
         * @note Currently, only WeChat and ByteDance mini-game support to load '.wasm.br' file.
         */
        wasmCompressionMode?: 'brotli';

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
         * 
         * @deprecated since 1.1.20, we force using true internal.
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

        /**
         * Preserve engine type info, this options will build a TS engine to the output directory.
         * It's useful when we need to take a step towards the AOT optimization.
         * This options is only supported on Open Harmony platform for now.
         * @default false
         */
        preserveType?: boolean;

        visualize?: boolean | {
            file?: string;
        };

        // buildTimeConstants: IBuildTimeConstants;

        /**
         * Generate cocos/native-binding/decorators.ts for native platforms
         */
        generateDecoratorsForJSB?: boolean;

        // /**
        //  * Whether force SUPPORT_JIT to the specified value.
        //  */
        // forceJitValue?: boolean,

        /**
         * Whether to generate 'named' register code for systemjs module format.
         * SystemJS default register code: System.register([], function(){...});
         * SystemJS named register code: System.register('module_name', [], function(){...});
         * @note It's only avaiable when options.moduleFormat is 'system'.
         */
        enableNamedRegisterForSystemJSModuleFormat?: boolean;
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

        /**
         * The dependency graph, only including dependency chunks.
         * 
         * @deprecated please use `chunkDepGraph` instead.
         */
        dependencyGraph?: Record<string, string[]>;
        
        chunkDepGraph: Record<string, string[]>;

        assetDepGraph: Record<string, string[]>;

        hasCriticalWarns: boolean;
    }

    export async function transform(code: string, moduleOption: ModuleFormat, loose?: boolean): Promise<{ code: string; }> {
        const babelFormat = moduleOptionsToBabelEnvModules(moduleOption);
        const babelFileResult = await babel.core.transformAsync(code, {
            presets: [[babel.presets.presetEnv, { modules: babelFormat, loose: loose ?? true } as babel.presets.presetEnv.Options]],
        });
        if (!babelFileResult || !babelFileResult.code) {
            throw new Error('Failed to transform!');
        }
        return {
            code: babelFileResult.code,
        };
    }

    export async function isSourceChanged(incrementalFile: string): Promise<boolean> {
        let record: Record<string, number>;
        try {
            record = await fs.readJSON(incrementalFile);
        } catch {
            console.debug(`Failed to read incremental file: ${incrementalFile} - rebuild is needed.`);
            return true;
        }
        for (const file of Object.keys(record)) {
            const mtime = record[file];
            try {
                /* eslint-disable-next-line no-await-in-loop */
                const mtimeNow = (await fs.stat(file)).mtimeMs;
                if (mtimeNow !== mtime) {
                    console.debug(`Source ${file} in watch files record ${incrementalFile} has a different time stamp - rebuild is needed.`);
                    return true;
                }
            } catch {
                console.debug(`Failed to read source ${file} in watch files record ${incrementalFile} - rebuild is needed.`);
                return true;
            }
        }
        return false;
    }

    // eslint-disable-next-line no-inner-declarations
    function _enumerateDependentChunks (meta: buildEngine.Result, featureUnits: string[]): string[] {
        const metaExports = meta.exports;
        const metaDepGraph = meta.chunkDepGraph;
        const result: string[] = [];
        const visited = new Set<string>();
        const addChunk = (chunkFileName: string): void => {
            if (visited.has(chunkFileName)) {
                return;
            }
            visited.add(chunkFileName);
            result.push(chunkFileName);
            if (metaDepGraph && chunkFileName in metaDepGraph) {
                for (const dependencyChunk of metaDepGraph[chunkFileName]) {
                    addChunk(dependencyChunk);
                }
            }
        };
        for (const featureUnit of featureUnits) {
            const chunkFileName = metaExports[featureUnit];
            if (!chunkFileName) {
                console.error(`Feature unit ${featureUnit} is not in build result!`);
                continue;
            }
            addChunk(chunkFileName);
        }
        return result;
    }

    // eslint-disable-next-line no-inner-declarations
    function _enumerateDependentAssets (meta: buildEngine.Result, dependentChunks: string[]): string[] {
        const metaDepAsset = meta.assetDepGraph;
        let result: string[] = [];
        for (const chunkName of dependentChunks) {
            const depAssets = metaDepAsset[chunkName];
            if (depAssets?.length > 0) {
                result = result.concat(depAssets);
            }
        }
        return result;
    }

    /**
     * Enumerates all chunk files that used by specified feature units.
     * @param meta Metadata of build result.
     * @param featureUnits Feature units.
     */
    export function enumerateDependentChunks (meta: buildEngine.Result, featureUnits: string[]): string[] {
        return _enumerateDependentChunks(meta, featureUnits);
    }

    /**
     * Enumerates all asset files that used by specified feature units.
     * @param meta Metadata of build result.
     * @param featureUnits Feature units.
     */
    export function enumerateDependentAssets (meta: buildEngine.Result, featureUnits: string[]): string[] {
        const dependentChunks = _enumerateDependentChunks(meta, featureUnits);
        return _enumerateDependentAssets(meta, dependentChunks);
    }

    /**
     * Enumerates all chunk files and asset files that used by specified feature units.
     * @param meta Metadata of build result.
     * @param featureUnits Feature units.
     */
    export function enumerateAllDependents (meta: buildEngine.Result, featureUnits: string[]): string[] {
        const dependentChunks = _enumerateDependentChunks(meta, featureUnits);
        const dependentAssets = _enumerateDependentAssets(meta, dependentChunks);
        return dependentAssets.concat(dependentChunks);
    }
}