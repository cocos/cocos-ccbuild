import fs from 'fs-extra';
import ps from 'path';
import { babel as Transformer } from '@ccbuild/transformer';
import { rollup as Bundler } from '@ccbuild/bundler';
import realFs from 'fs';
import tsConfigPaths from './rollup-plugins/ts-paths';
import moduleQueryPlugin from './rollup-plugins/module-query-plugin';
import removeDeprecatedFeatures from './rollup-plugins/remove-deprecated-features';
import type { buildEngine } from '../index';
import { externalWasmLoader } from './rollup-plugins/external-wasm-loader';
import { StatsQuery } from '@ccbuild/stats-query';
import { filePathToModuleRequest } from '@ccbuild/utils';

// import babel
import babel = Transformer.core;
import babelPresetEnvOptions = Transformer.presets.presetEnv.Options;
import babelPluginTransformForOf = Transformer.plugins.transformForOf;
import babelPresetEnv = Transformer.presets.presetEnv;
import babelPluginDynamicImportVars = Transformer.plugins.cocosDynamicImportVars;
import babelPresetCC = Transformer.presets.presetCC.babelPresetCC;
import helpers = Transformer.presets.presetCC.helpers;

// import rollup
import rollup = Bundler.core;
import rpBabel = Bundler.plugins.babel.babel;
import RollupBabelInputPluginOptions = Bundler.plugins.babel.RollupBabelInputPluginOptions;
import json = Bundler.plugins.json;
import resolve = Bundler.plugins.nodeResolve;
import commonjs = Bundler.plugins.commonjs;
import rpTerser = Bundler.plugins.terser.terser;
import rpVirtual = Bundler.plugins.virtual;
import { ModuleQuery } from '@ccbuild/modularize';
// import rpProgress = Bundler.plugins.progress;

// import * as decoratorRecorder from './babel-plugins/decorator-parser';

const realPath = (function (): (file: string) => Promise<string> {
    const realpath = typeof realFs.realpath.native === 'function' ? realFs.realpath.native : realFs.realpath;
    return (file: string): Promise<string> => new Promise<string>((resolve, reject) => {
        realpath(file, (err, path) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            } else {
                resolve(err ? file : path);
            }
        });
    });
})();

function makePathEqualityKey(path: string): string {
    return process.platform === 'win32' ? path.toLocaleLowerCase() : path;
}

export async function buildJsEngine(options: Required<buildEngine.Options>): Promise<buildEngine.Result> {
    const doUglify = !!options.compress;
    const engineRoot = ps.resolve(options.engine);

    const rollupFormat = options.moduleFormat ?? 'iife';

    const statsQuery = await StatsQuery.create(engineRoot);
    const moduleQuery = new ModuleQuery({
        engine: engineRoot,
        platform: options.platform, 
    });

    if (options.features) {
        for (const feature of options.features) {
            if (!statsQuery.hasFeature(feature)) {
                console.warn(`'${feature}' is not a valid feature.`);
            }
        }
    }

    let features: string[];
    let split = options.split ?? false;
    if (options.features && options.features.length !== 0) {
        features = options.features;
    } else {
        features = statsQuery.getFeatures();
        if (split !== true) {
            split = true;
            console.warn(
                `You did not specify features which implies 'split: true'. `
                + `Explicitly set 'split: true' to suppress this warning.`,
            );
        }
    }


    let { ammoJsWasm } = options;
    ammoJsWasm ??= true;  // default is true
    const forceBanningBulletWasm = !ammoJsWasm;
    const flags = options.flags ?? {};
    flags.FORCE_BANNING_BULLET_WASM = forceBanningBulletWasm;
    const intrinsicFlags = statsQuery.getIntrinsicFlagsOfFeatures(features);
    let buildTimeConstants = statsQuery.constantManager.genBuildTimeConstants({
        mode: options.mode,
        platform: options.platform,
        flags,
    });
    buildTimeConstants = {
        ...intrinsicFlags,
        ...buildTimeConstants,
    };

    // if (typeof options.forceJitValue !== undefined) {
    //     buildTimeConstants['SUPPORT_JIT'] = options.forceJitValue as boolean;
    // }

    const moduleOverrides = Object.entries(statsQuery.evaluateModuleOverrides({
        mode: options.mode,
        platform: options.platform,
        buildTimeConstants,
    })).reduce((result, [k, v]) => {
        result[makePathEqualityKey(k)] = v;
        return result;
    }, {} as Record<string, string>);

    const featureUnits = statsQuery.getUnitsOfFeatures(features);

    const rpVirtualOptions: Record<string, string> = {};

    const vmInternalConstants = statsQuery.constantManager.exportStaticConstants({
        platform: options.platform,
        mode: options.mode,
        flags,
    });
    console.debug(`Module source "internal-constants":\n${vmInternalConstants}`);
    rpVirtualOptions['internal:constants'] = vmInternalConstants;
    rpVirtualOptions[helpers.CC_HELPER_MODULE] = helpers.generateHelperModuleSource();

    // for some modules that we need to instantiate before cc module
    // const forceStandaloneModules = ['wait-for-ammo-instantiation'];
    const forceStandaloneModules: string[] = [];

    let rollupEntries: NonNullable<rollup.RollupOptions['input']> | undefined;
    if (split) {
        rollupEntries = featureUnits.reduce((result, featureUnit) => {
            result[featureUnit] = statsQuery.getFeatureUnitFile(featureUnit);
            return result;
        }, {} as Record<string, string>);
    } else {
        rollupEntries = {
            cc: 'cc',
        };
        const selectedFeatureUnits = [];
        for (const featureUnit of featureUnits) {
            if (forceStandaloneModules.includes(featureUnit)) {
                rollupEntries[featureUnit] = statsQuery.getFeatureUnitFile(featureUnit);
            } else {
                selectedFeatureUnits.push(featureUnit);
            }
        }

        rpVirtualOptions.cc = statsQuery.evaluateIndexModuleSource(
            selectedFeatureUnits,
            (featureUnit) => filePathToModuleRequest(statsQuery.getFeatureUnitFile(featureUnit)),
        );
        rollupEntries.cc = 'cc';

        console.debug(`Module source "cc":\n${rpVirtualOptions.cc}`);
    }

    const presetEnvOptions: babelPresetEnvOptions = {
        loose: options.loose ?? true,
        // We need explicitly specified targets.
        // Ignore it to avoid the engine's parent dirs contain unexpected config.
        ignoreBrowserslistConfig: true,
    };
    if (options.targets !== undefined) {
        presetEnvOptions.targets = options.targets;
    }

    const babelPlugins: any[] = [];
    if (options.targets === undefined) {
        babelPlugins.push([babelPluginTransformForOf, {
            loose: true,
        }]);
    }

    babelPlugins.push(
        [babelPluginDynamicImportVars, {
            resolve: {
                forwardExt: 'resolved',
            },
        }],
    );

    interface BabelOverrides {
        overrides?: Array<{
            test: RegExp | string;
        } & babel.TransformOptions>,
    }

    const { fieldDecorators, editorDecorators } = statsQuery.getOptimizeDecorators();

    const babelOptions: RollupBabelInputPluginOptions & BabelOverrides = {
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts'],
        exclude: [
            /node_modules[/\\]@cocos[/\\]ammo/,
            /node_modules[/\\]@cocos[/\\]cannon/,
            /node_modules[/\\]@cocos[/\\]physx/,
            /\.asm\.js/,
        ],
        comments: false, // Do not preserve comments, even in debug build since we have source map
        overrides: [{
            // Eliminates the babel compact warning:
            // 'The code generator has deoptimised the styling of ...'
            // that came from node_modules/@cocos
            test: /node_modules[/\\]@cocos[/\\]/,
            compact: true,
        }],
        plugins: babelPlugins,
        presets: [
            [babelPresetEnv, presetEnvOptions],
            [babelPresetCC, {
                allowDeclareFields: true,
                ccDecoratorHelpers: 'external',
                fieldDecorators,
                editorDecorators,
            } as babelPresetCC.Options],
        ],
    };
    
    // if (options.generateDecoratorsForJSB) {
    //     if (!process.env.ENGINE_PATH) {
    //         throw new Error('ENGINE_PATH environment variable not set');
    //     }
    //     babelOptions.presets?.push([() => ({ plugins: [[decoratorRecorder]] })]);
    // }

    const rollupPlugins: rollup.Plugin[] = [];

    if (options.noDeprecatedFeatures) {
        rollupPlugins.push(removeDeprecatedFeatures(
            typeof options.noDeprecatedFeatures === 'string' ? options.noDeprecatedFeatures : undefined,
        ));
    }

    rollupPlugins.push(
        externalWasmLoader({
            externalRoot: ps.join(engineRoot, 'native/external'),
            wasmSupportMode: buildTimeConstants.WASM_SUPPORT_MODE,
            forceBanningBulletWasm,
            cullAsmJsModule: buildTimeConstants.CULL_ASM_JS_MODULE,
            format: 'relative-from-chunk',
            wasmFallback: buildTimeConstants.WASM_FALLBACK,
            wasmSubpackage: buildTimeConstants.WASM_SUBPACKAGE,
        }),

        {
            name: '@cocos/ccbuild|module-overrides',
            resolveId(source, importer): string | null {
                if (moduleOverrides[source]) {
                    return source;
                } else {
                    return null;
                }
            },
            load(this, id: string): string | null {
                const key = makePathEqualityKey(id);
                if (!(key in moduleOverrides)) {
                    return null;
                }
                const replacement = moduleOverrides[key];
                console.debug(`Redirect module ${id} to ${replacement}`);
                return `export * from '${filePathToModuleRequest(replacement)}';`;
            },
        },

        rpVirtual(rpVirtualOptions),

        moduleQueryPlugin(moduleQuery),

        tsConfigPaths({
            configFileName: ps.resolve(options.engine, 'tsconfig.json'),
        }),

        resolve({
            extensions: ['.js', '.ts', '.json'],
            jail: await realPath(engineRoot),
            rootDir: engineRoot,
        }),

        json({
            preferConst: true,
        }),


        commonjs({
            include: [
                /node_modules[/\\]/,
                /asm\.js/,
            ],
            sourceMap: false,
        }),

        rpBabel({
            skipPreflightCheck: true,
            ...babelOptions,
        }),
    );

    // if (options.progress) {
    //     rollupPlugins.unshift(rpProgress());
    // }

    if (doUglify) { // TODO: tree-shaking not clear!
        rollupPlugins.push(rpTerser({
            // see https://github.com/terser/terser#compress-options
            compress: {
                reduce_funcs: false, // reduce_funcs not suitable for ammo.js
                keep_fargs: false,
                unsafe_Function: true,
                unsafe_math: true,
                unsafe_methods: true,
                passes: 2,  // first: remove deadcodes and const objects, second: drop variables
            },
            mangle: doUglify,
            keep_fnames: !doUglify,
            output: {
                beautify: !doUglify,
            },

            // https://github.com/rollup/rollup/issues/3315
            // We only do this for CommonJS.
            // Especially, we cannot do this for IIFE.
            toplevel: rollupFormat === 'cjs',
        }));
    }

    // const visualizeOptions = typeof options.visualize === 'object'
    //     ? options.visualize
    //     : (options.visualize ? {} : undefined);
    // if (visualizeOptions) {
    //     let rpVisualizer;
    //     try {
    //         // @ts-expect-error: No typing
    //         rpVisualizer = await import('rollup-plugin-visualizer');
    //     } catch {
    //         console.warn('Visualizing needs \'rollup-plugin-visualizer\' to be installed. It\'s installed as dev-dependency.');
    //     }
    //     if (rpVisualizer) {
    //         const visualizeFile = visualizeOptions.file ?? ps.join(options.out, 'visualize.html');
    //         rollupPlugins.push(rpVisualizer({
    //             filename: visualizeFile,
    //             title: 'Cocos Creator build visualizer',
    //             template: 'treemap',
    //         }));
    //     }
    // }

    let hasCriticalWarns = false;

    const rollupWarningHandler: rollup.WarningHandlerWithDefault = (warning, defaultHandler) => {
        if (typeof warning !== 'string') {
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
                hasCriticalWarns = true;
            } else if (warning.code === 'THIS_IS_UNDEFINED') {
                // TODO: It's really inappropriate to do this...
                // Let's fix these files instead of suppressing rollup.
                if (warning.id?.match(/(?:spine-core\.js$)|(?:dragonBones\.js$)/)) {
                    console.debug(`Rollup warning 'THIS_IS_UNDEFINED' is omitted for ${warning.id}`);
                    return;
                }
            }
        }

        defaultHandler(warning);
    };

    const rollupOptions: rollup.InputOptions = {
        input: rollupEntries,
        plugins: rollupPlugins,
        cache: false,
        onwarn: rollupWarningHandler,
    };

    const perf = true;

    if (perf) {
        rollupOptions.perf = true;
    }

    const rollupBuild = await rollup.rollup(rollupOptions);

    const timing = rollupBuild.getTimings?.();
    if (timing) {
        console.debug(`==== Performance ====`);
        console.debug(JSON.stringify(timing));
        console.debug(`====             ====`);
    }

    const { incremental: incrementalFile } = options;
    if (incrementalFile) {
        const watchFiles: Record<string, number> = {};
        const files = rollupBuild.watchFiles;
        await Promise.all(files.map(async (watchFile) => {
            try {
                const stat = await fs.stat(watchFile);
                watchFiles[watchFile] = stat.mtimeMs;
            } catch {
                // the `watchFiles` may contain non-fs modules.
            }
        }));
        await fs.ensureDir(ps.dirname(incrementalFile));
        await fs.writeFile(incrementalFile, JSON.stringify(watchFiles, undefined, 2));
    }

    const result: buildEngine.Result = {
        chunkAliases: {},
        exports: {},
        chunkDepGraph: {},
        assetDepGraph: {},
        hasCriticalWarns: false,
    };

    const rollupOutputOptions: rollup.OutputOptions = {
        format: rollupFormat,
        sourcemap: options.sourceMap,
        sourcemapFile: options.sourceMapFile,
        name: (rollupFormat === 'iife' ? 'ccm' : undefined),
        dir: options.out,
        // NOTE: parallel dynamic import has some issue on SystemJS, especially on OH platform
        // see: https://github.com/systemjs/systemjs/issues/2297
        inlineDynamicImports: options.platform === 'OPEN_HARMONY',
        // minifyInternalExports: false,
        // preserveEntrySignatures: "allow-extension",
    };

    const rollupOutput = await rollupBuild.write(rollupOutputOptions);

    const validEntryChunks: Record<string, string> = {};
    for (const output of rollupOutput.output) {
        if (output.type === 'chunk') {
            if (output.isEntry) {
                const chunkName = output.name;
                if (chunkName in rollupEntries || chunkName === 'cc') {
                    validEntryChunks[chunkName] = output.fileName;
                }
            }
        }
    }

    Object.assign(result.exports, validEntryChunks);

    result.dependencyGraph = {};
    for (const output of rollupOutput.output) {
        if (output.type === 'chunk') {
            const depList = output.imports.concat(output.dynamicImports);
            result.dependencyGraph[output.fileName] = depList;
            result.chunkDepGraph[output.fileName] = depList;
            result.assetDepGraph[output.fileName] = output.referencedFiles.slice();
        }
    }

    result.hasCriticalWarns = hasCriticalWarns;

    return result;
}