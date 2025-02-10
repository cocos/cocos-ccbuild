import ps from 'path';
import fs from 'fs-extra';
import JSON5 from 'json5';
import dedent from 'dedent';
import { Config, Context, Feature, IndexConfig, Test, IConstantConfig, IConstantInfo } from './config-interface';

import * as ConfigInterface from './config-interface';
import { PlatformType as _PlatformType } from '@ccbuild/modularize';
export { ConfigInterface };

/**
 * Query any any stats of the engine.
 * @group Merged Types
 */
export class StatsQuery {
    /**
     * @param engine Path to the engine root.
     */
    public static async create (engine: string): Promise<StatsQuery> {
        const configFile = ps.join(engine, 'cc.config.json');
        const config: Config = JSON5.parse(await fs.readFile(configFile, 'utf8'));
        // @ts-expect-error we should delete this property
        delete config['$schema'];
        const query = new StatsQuery(engine, config);
        await query._initialize();
        return query;
    }

    /**
     * Constant manager for engine and user.
     */
    public constantManager: StatsQuery.ConstantManager;

    /**
     * Gets the path to the engine root.
     */
    get path (): string {
        return this._engine;
    }

    /**
     * Gets the path to tsconfig.
     */
    get tsConfigPath (): string {
        return ps.join(this._engine, 'tsconfig.json');
    }
    
    /**
     * Gets all optimzie decorators
     */
    public getOptimizeDecorators (): ConfigInterface.IOptimizeDecorators {
        return this._config.optimizeDecorators;
    }

    /**
     * Gets TreeShake config
     */
    public getTreeShakeConfig (): ConfigInterface.ITreeShakeConfig | undefined {
        return this._config.treeShake;
    }

    /**
     * Gets all features defined.
     */
    public getFeatures (): string[] {
        return Object.keys(this._features);
    }

    /**
     * Returns if the specified feature is defined.
     * @param feature Feature ID.
     */
    public hasFeature (feature: string): boolean {
        return !!this._features[feature];
    }

    // TODO: it seems we don't need this interface for now.
    // public isNativeOnlyFeature (feature: string) {
    //     return !!this._features[feature].isNativeOnly;
    // }

    /**
     * Gets all feature units included in specified features.
     * @param featureIds Feature ID.
     */
    public getUnitsOfFeatures (featureIds: string[]): string[] {
        const units = new Set<string>();
        for (const featureId of featureIds) {
            this._features[featureId]?.modules.forEach((entry) => units.add(entry));
        }
        return Array.from(units);
    }

    public getIntrinsicFlagsOfFeatures (featureIds: string[]): Record<string, number | boolean | string> {
        const flags: Record<string, unknown> = {};
        for (const featureId of featureIds) {
            const featureFlags = this._features[featureId]?.intrinsicFlags;
            if (featureFlags) {
                Object.assign(flags, featureFlags);
            }
        }
        return flags as Record<string, number | boolean | string>;
    }

    public getOverriddenConstantsOfFeatures (featureIds: string[]): Record<string, number | boolean> {
        const constants: Record<string, unknown> = {};
        for (const featureId of featureIds) {
            const featureConstants = this._features[featureId]?.overrideConstants;
            if (featureConstants) {
                Object.assign(constants, featureConstants);
            }
        }
        return constants as Record<string, number | boolean>;
    }

    /**
     * Gets all feature units in their names.
     */
    public getFeatureUnits (): string[] {
        return Object.keys(this._featureUnits);
    }

    /**
     * Gets the path to source file of the feature unit.
     * @param moduleId Name of the feature unit.
     */
    public getFeatureUnitFile (featureUnit: string): string {
        return this._featureUnits[featureUnit];
    }

    /**
     * Gets all editor public modules in their names.
     */
    public getEditorPublicModules (): string[] {
        return Object.keys(this._editorPublicModules);
    }

    /**
     * Gets the path to source file of the editor-public module.
     * @param moduleName Name of the public module.
     */
    public getEditorPublicModuleFile (moduleName: string): string {
        return this._editorPublicModules[moduleName];
    }

    /**
     * Gets the source of `'cc'`.
     * @param featureUnits Involved feature units.
     * @param mapper If exists, map the feature unit name into another module request.
     */
    public evaluateIndexModuleSource (featureUnits: string[], mapper?: (featureUnit: string) => string): string {
        return featureUnits.map((featureUnit) => {
            const indexInfo = this._index.modules[featureUnit];
            const ns = indexInfo?.ns;
            if (ns) {
                return dedent`
                    import * as ${ns} from '${mapper?.(featureUnit) ?? featureUnit}';
                    export { ${ns} };
                `;
            }
            return `export * from '${mapper?.(featureUnit) ?? featureUnit}';`;
        }).join('\n');
    }

    /**
     * Evaluates the source of `'internal-constants'`(`'cc/env'`),
     * @param context
     */
    public evaluateEnvModuleSourceFromRecord (record: Record<string, unknown>): string {
        return Object.entries(record).map(([k, v]) => `export const ${k} = ${v};`).join('\n');
    }

    /**
     * Evaluates module overrides under specified context.
     * @param context
     */
    public evaluateModuleOverrides (context: Context): Record<string, string> {
        const overrides: Record<string, string> = {};

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        const addModuleOverrides = (moduleOverrides: Record<string, string>, isVirtualModule: boolean) => {
            // eslint-disable-next-line prefer-const
            for (let [source, override] of Object.entries(moduleOverrides)) {
                const normalizedSource = isVirtualModule ? source : ps.resolve(this._engine, source);
                override = this._evalPathTemplate(override, context);
                const normalizedOverride = ps.resolve(this._engine, override);
                overrides[normalizedSource] = normalizedOverride;
            }
        };

        this._config.moduleOverrides?.forEach(({ test, overrides, isVirtualModule }) => {
            if (this.evalTest(test, context)) {
                addModuleOverrides(overrides, isVirtualModule);
            }
        });

        return overrides;
    }

    private static async _readModulesInDir (exportsDir: string, mapper: (baseName: string) => string): Promise<Record<string, string>> {
        const result: Record<string, string> = {};
        for (const entryFileName of await fs.readdir(exportsDir)) {
            const entryExtName = ps.extname(entryFileName);
            if (!entryExtName.toLowerCase().endsWith('.ts')) {
                continue;
            }
            const baseName = ps.basename(entryFileName, entryExtName);
            const moduleName = mapper(baseName);
            const entryFile = ps.join(exportsDir, entryFileName);
            result[moduleName] = entryFile;
        }
        return result;
    }

    private static _baseNameToFeatureUnitName (baseName: string): string {
        return `${baseName}`;
    }

    private static _editorBaseNameToModuleName (baseName: string): string {
        return `cc/editor/${baseName}`;
    }

    private constructor (engine: string, config: Config) {
        this._config = config;
        this._engine = engine;
        this.constantManager = new StatsQuery.ConstantManager(engine);
    }

    public evalTest<T> (test: Test, context: Context): T {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
        const result = new Function('context', `return ${test}`)(context) as T;
        // console.debug(`Eval "${test}" to ${result}`);
        return result;
    }

    private _evalPathTemplate (pathTemplate: string, context: Context): string {
        let resultPath = pathTemplate;
        const regExp = /\{\{(.*?)\}\}/g;
        let exeResult;
        while (exeResult = regExp.exec(pathTemplate)) {
            const templateItem = exeResult[0];
            const exp = exeResult[1];
            const evalResult = (new Function('context', `return ${exp}`)(context)) as string;
            resultPath = pathTemplate.replace(templateItem, evalResult);
        }
        return resultPath;
    }

    private async _initialize (): Promise<void> {
        const { _config: config, _engine: engine } = this;

        const featureUnits = this._featureUnits = await StatsQuery._readModulesInDir(
            ps.join(engine, 'exports'), StatsQuery._baseNameToFeatureUnitName,
        );

        for (const [featureName, feature] of Object.entries(config.features)) {
            const parsedFeature = this._features[featureName] = { modules: [] } as Feature;
            for (const moduleFileBaseName of feature.modules) {
                const featureUnitName = StatsQuery._baseNameToFeatureUnitName(moduleFileBaseName);
                if (!featureUnits[featureUnitName]) {
                    throw new Error(`Invalid config file: '${moduleFileBaseName}' is not a valid module.`);
                }
                parsedFeature.modules.push(featureUnitName);
            }
            parsedFeature.intrinsicFlags = feature.intrinsicFlags;
            parsedFeature.overrideConstants = feature.overrideConstants;
        }

        if (config.index) {
            if (config.index.modules) {
                for (const [k, v] of Object.entries(config.index.modules)) {
                    this._index.modules[StatsQuery._baseNameToFeatureUnitName(k)] = v;
                }
            }
            this._index = {
                ...config.index,
                modules: this._index.modules,
            };
        }

        this._editorPublicModules = await StatsQuery._readModulesInDir(
            ps.join(engine, 'editor', 'exports'), StatsQuery._editorBaseNameToModuleName,
        );
    }

    private _engine: string;
    private _index: ParsedIndexConfig = { modules: {} };
    private _features: Config['features'] = {};
    private _config: Readonly<Config>;
    private _featureUnits: Record<string, string> = {};
    private _editorPublicModules: Record<string, string> = {};
}

type ParsedIndexConfig = Omit<IndexConfig, 'modules'> & {
    modules: NonNullable<IndexConfig['modules']>;
};


/**
 * @group Merged Types
 */
export namespace StatsQuery {
    export namespace ConstantManager {

        export type PlatformType = _PlatformType;
        export type IPlatformConfig = {
            [key in PlatformType]: boolean;
        };
        
        export interface IInternalFlagConfig {
            SERVER_MODE: boolean; 
            NOT_PACK_PHYSX_LIBS: boolean; 
            WEBGPU: boolean;
            /**
             * Native code (wasm/asmjs) bundle mode, 0: asmjs, 1: wasm, 2: both
             * @default 2
             */
            NATIVE_CODE_BUNDLE_MODE: number;

            /**
             * An internal constant to indicate whether we cull the meshopt wasm module and asm.js module.
             * 
             * @default false
             */
            CULL_MESHOPT: boolean;
            /**
             * An internal constant to indicate whether we use wasm assets as minigame subpackage.
             * This is useful when we need to reduce code size.
             */
            WASM_SUBPACKAGE: boolean;

            /**
             * An internal constant to indicate whether we're using 3D modules.
             */
            USE_3D: boolean;

            /**
             * An internal constant to indicate whether we're using ui skew module.
             */
            USE_UI_SKEW: boolean;
        }
        
        export interface IPublicFlagConfig {
            DEBUG: boolean;
            NET_MODE: number; 
        }
        
        export interface IFlagConfig extends IInternalFlagConfig, IPublicFlagConfig {}
        
        export interface IModeConfig {
            EDITOR: boolean;
            PREVIEW: boolean; 
            BUILD: boolean; 
            TEST: boolean;
        }
        
        export interface IConstantOptions {
            platform: PlatformType;
            flagConfig: IFlagConfig;
        }
        
        export type ModeType = keyof IModeConfig;
        export type FlagType = keyof IFlagConfig; 
        
        export interface BuildTimeConstants extends IPlatformConfig, IFlagConfig, IModeConfig {}
        export interface CCEnvConstants extends IPlatformConfig, IPublicFlagConfig, IModeConfig {}
        
        export type ValueType = boolean | number; 
        
        export interface ConstantOptions {
            mode: ModeType;
            platform: PlatformType;
            flags: Partial<Record<FlagType, ValueType>>;
        }
    }

    export class ConstantManager {
        private _engineRoot: string;

        constructor (engineRoot: string) {
            this._engineRoot = engineRoot;
        }

        //#region export string
        public exportDynamicConstants ({
            mode,
            platform,
            flags,
        }: ConstantManager.ConstantOptions): string {
            const config = this._getConfig();
            // init helper
            let result = '';
            if (this._hasCCGlobal(config)) {
                result += fs.readFileSync(ps.join(__dirname, '../../../static/helper-global-exporter.txt'), 'utf8').replace(/\r\n/g, '\n') + '\n';
            }
            if (this._hasDynamic(config)) {
                result += fs.readFileSync(ps.join(__dirname, '../../../static/helper-dynamic-constants.txt'), 'utf8').replace(/\r\n/g, '\n') + '\n';
            }
            
            // update value
            if (config[mode]) {
                config[mode].value = true;
            } else {
                console.warn(`Unknown mode: ${mode}`);
            }
            if (config[platform]) {
                config[platform].value = true;
            } else {
                console.warn(`Unknown platform: ${platform}`);
            }
            for (const key in flags) {
                const value = flags[key as ConstantManager.FlagType]!;
                if (config[key]) {
                    config[key].value = value;
                } else {
                    console.warn(`Unknown flag: ${key}`);
                }
            }

            // eval value
            for (const key in config) {
                const info = config[key];
                if (typeof info.value === 'string') {
                    info.value = this._evalExpression(info.value, config);
                }
            }

            // generate export content
            for (const key in config) {
                const info = config[key];
                const value = info.value;
                if (info.dynamic) {
                    continue;
                }
                result += `export const ${key} = ${value};\n`;
                if (info.ccGlobal) {
                    result += `tryDefineGlobal('CC_${key}', ${value});\n`;
                }
                result += '\n';
            }

            return result;
        }

        public genBuildTimeConstants (options: ConstantManager.ConstantOptions): ConstantManager.BuildTimeConstants {
            const config = this._getConfig();

            this._applyOptionsToConfig(config, options);

            // generate json object
            const jsonObj: Record<string, ConstantManager.ValueType> = {};
            for (const key in config) {
                const info = config[key];
                jsonObj[key] = info.value as ConstantManager.ValueType;
            }
            return jsonObj as unknown as ConstantManager.BuildTimeConstants;
        }

        public genCCEnvConstants (options: ConstantManager.ConstantOptions): ConstantManager.CCEnvConstants {
            const config = this._getConfig();

            this._applyOptionsToConfig(config, options);

            // generate json object
            const jsonObj: Record<string, ConstantManager.ValueType> = {};
            for (const key in config) {
                const info = config[key];
                if (!info.internal) {
                    jsonObj[key] = info.value as StatsQuery.ConstantManager.ValueType;
                }
            }
            return jsonObj as unknown as StatsQuery.ConstantManager.CCEnvConstants;
        }

        public exportStaticConstants ({
            mode,
            platform,
            flags,
        }: ConstantManager.ConstantOptions): string {
            const config = this._getConfig();
            // init helper
            let result = '';
            if (this._hasCCGlobal(config)) {
                result += fs.readFileSync(ps.join(__dirname, '../../../static/helper-global-exporter.txt'), 'utf8').replace(/\r\n/g, '\n') + '\n';
            }

            // update value
            if (config[mode]) {
                config[mode].value = true;
            } else {
                console.warn(`Unknown mode: ${mode}`);
            }
            if (config[platform]) {
                config[platform].value = true;
            } else {
                console.warn(`Unknown platform: ${platform}`);
            }
            for (const key in flags) {
                const value = flags[key as ConstantManager.FlagType]!;
                if (config[key]) {
                    config[key].value = value;
                } else {
                    console.warn(`Unknown flag: ${key}`);
                }
            }

            // eval value
            for (const key in config) {
                const info = config[key];
                if (typeof info.value === 'string') {
                    info.value = this._evalExpression(info.value, config);
                }
            }

            // generate export content
            for (const key in config) {
                const info = config[key];
                const value = info.value;
                
                let declarationKind = 'const';
                if (platform === 'OPEN_HARMONY' && key === 'NATIVE_CODE_BUNDLE_MODE') {
                    declarationKind = 'let'; // HACK: on OH platform, we cannot compile successfully when declarationKind is const.
                }
                result += `export ${declarationKind} ${key} = ${value};\n`;
                if (info.ccGlobal) {
                    result += `tryDefineGlobal('CC_${key}', ${value});\n`;
                }
                result += '\n';
            }

            return result;
        }
        //#endregion export string

        //#region declaration
        public genInternalConstants (): string {
            const config = this._getConfig();

            let result = `declare module 'internal:constants'{\n`;

            for (const name in config) {
                const info = config[name];
                result += this._genConstantDeclaration(name, info);
            }
            result += '}\n';

            return result;
        }

        public genCCEnv (): string {
            const config = this._getConfig();

            let result = `declare module 'cc/env'{\n`;

            for (const name in config) {
                const info = config[name];
                if (info.internal) {
                    continue;
                }
                result += this._genConstantDeclaration(name, info);
            }
            result += '}\n';

            return result;
        }
        
        private _genConstantDeclaration (name: string, info: IConstantInfo): string {
            let result = '\t/**\n';
            const comments = info.comment.split('\n');
            for (const comment of comments) {
                result += `\t * ${comment}\n`;
            }
            result += '\t */\n';
            result += `\texport const ${name}: ${info.type};\n\n`;
            return result;
        }
        //#endregion declaration

        //#region utils
        private _getConfig (): IConstantConfig {
            const engineConfig =  fs.readJsonSync(ps.join(this._engineRoot, './cc.config.json').replace(/\\/g, '/')) as Config;
            const config = engineConfig.constants;

            // init default value
            for (const key in config) {
                const info = config[key];
                if (typeof info.ccGlobal === 'undefined') {
                    info.ccGlobal = false;
                }
                if (typeof info.dynamic === 'undefined') {
                    info.dynamic = false;
                }
            }
            return config;
        }

        private _hasCCGlobal (config: IConstantConfig): boolean {
            for (const key in config) {
                const info = config[key];
                if (info.ccGlobal) {
                    return true;
                }
            }
            return false;
        }

        private _hasDynamic (config: IConstantConfig): boolean {
            for (const key in config) {
                const info = config[key];
                if (info.dynamic) {
                    return true;
                }
            }
            return false;
        }

        private _evalExpression (expression: string, config: IConstantConfig): boolean {
            // eval sub expression
            const matchResult = expression.match(/(?<=\$)\w+/g);
            if (matchResult) {
                for (const name of matchResult) {
                    const value = config[name].value;
                    if (typeof value === 'string') {
                        config[name].value = this._evalExpression(value, config);
                    }
                }
            }
            // $EDITOR to $EDITOR.value
            expression = expression.replace(/(?<=\$)(\w+)/g, '$1.value');
            // $EDITOR to $.EDITOR.value
            expression = expression.replace(/\$/g, '$.');
            // do eval
            const evalFn = new Function('$', `return ${expression}`);
            return evalFn(config);
        }

        private _applyOptionsToConfig (config: IConstantConfig, options: ConstantManager.ConstantOptions): void {
            const { mode, platform, flags } = options;

            // update value
            if (config[mode]) {
                config[mode].value = true;
            } else {
                console.warn(`Unknown mode: ${mode}`);
            }
            if (config[platform]) {
                config[platform].value = true;
            } else {
                console.warn(`Unknown platform: ${platform}`);
            }
            for (const key in flags) {
                const value = flags[key as ConstantManager.FlagType]!;
                if (config[key]) {
                    config[key].value = value;
                } else {
                    console.warn(`Unknown flag: ${key}`);
                }
            }

            // eval value
            for (const key in config) {
                const info = config[key];
                if (typeof info.value === 'string') {
                    info.value = this._evalExpression(info.value, config);
                }
            }
        }
        //#endregion utils
    }
}


