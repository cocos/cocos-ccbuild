interface IPlatformConfig {
    HTML5: boolean; 
    NATIVE: boolean; 
    WECHAT: boolean; 
    BAIDU: boolean; 
    XIAOMI: boolean; 
    ALIPAY: boolean; 
    BYTEDANCE: boolean; 
    OPPO: boolean; 
    VIVO: boolean; 
    HUAWEI: boolean; 
    COCOSPLAY: boolean; 
    QTT: boolean; 
    LINKSURE: boolean;
    OPEN_HARMONY: boolean;
}

export type PlatformType = keyof IPlatformConfig;

type FlagValueType = number | boolean;

interface IInternalFlagConfig {
    SERVER_MODE: FlagValueType; 
    NOT_PACK_PHYSX_LIBS: FlagValueType; 
    WEBGPU: FlagValueType;
}

interface IPublicFlagConfig {
    DEBUG: FlagValueType;
    NET_MODE: FlagValueType; 
    EDITOR: FlagValueType; 
    PREVIEW: FlagValueType; 
    BUILD: FlagValueType; 
    TEST: FlagValueType;
}

export interface IFlagConfig extends IInternalFlagConfig, IPublicFlagConfig {}

export interface IConstantOptions {
    platform: PlatformType;
    flagConfig: IFlagConfig;
}

export class ConfigParser {
    // private _engineRoot: string;

    // constructor (engineRoot: string) {
    //     this._engineRoot = engineRoot;
    // }

    // //#region export string
    // public exportDynamicConstants ({
    //     platform,
    //     flagConfig,
    // }: IConstantOptions): string {
    //     const config = this._getConfig();
    //     // init helper
    //     let result = '';
    //     if (this._hasCCGlobal(config)) {
    //         result += fsExt.readFileSync(ps.join(__dirname, '../static/helper-global-exporter.txt'), 'utf8') + '\n';
    //     }
    //     if (this._hasDynamic(config)) {
    //         result += fsExt.readFileSync(ps.join(__dirname, '../static/helper-dynamic-constants.txt'), 'utf8') + '\n';
    //     }
        
    //     // update value
    //     if (config[mode]) {
    //         config[mode].value = true;
    //     } else {
    //         console.warn(`Unknown mode: ${mode}`);
    //     }
    //     if (config[platform]) {
    //         config[platform].value = true;
    //     } else {
    //         console.warn(`Unknown platform: ${platform}`);
    //     }
    //     for (const key in flags) {
    //         const value = flags[key as FlagType]!;
    //         if (config[key]) {
    //             config[key].value = value;
    //         } else {
    //             console.warn(`Unknown flag: ${key}`);
    //         }
    //     }

    //     // eval value
    //     for (const key in config) {
    //         const info = config[key];
    //         if (typeof info.value === 'string') {
    //             info.value = this._evalExpression(info.value, config);
    //         }
    //     }

    //     // generate export content
    //     for (const key in config) {
    //         const info = config[key];
    //         const value = info.value;
    //         if (info.dynamic || info.internal) {
    //             continue;
    //         }
    //         result += `export const ${key} = ${value};\n`;
    //         if (info.ccGlobal) {
    //             result += `tryDefineGlobal('CC_${key}', ${value});\n`
    //         }
    //         result += '\n';
    //     }

    //     return result;
    // }

    // public genBuildTimeConstants (options: ConstantOptions): BuildTimeConstants {
    //     const config = this._getConfig();

    //     this._applyOptionsToConfig(config, options);

    //     // generate json object
    //     const jsonObj: Record<string, ValueType> = {};
    //     for (const key in config) {
    //         const info = config[key];
    //         jsonObj[key] = info.value as ValueType;
    //     }
    //     return jsonObj as BuildTimeConstants;
    // }

    // public genCCEnvConstants (options: ConstantOptions): CCEnvConstants {
    //     const config = this._getConfig();

    //     this._applyOptionsToConfig(config, options);

    //     // generate json object
    //     const jsonObj: Record<string, ValueType> = {};
    //     for (const key in config) {
    //         const info = config[key];
    //         if (!info.internal) {
    //             jsonObj[key] = info.value as ValueType;
    //         }
    //     }
    //     return jsonObj as CCEnvConstants;
    // }

    // public exportStaticConstants ({
    //     mode,
    //     platform,
    //     flags,
    // }: ConstantOptions): string {
    //     const config = this._getConfig();
    //     // init helper
    //     let result = '';
    //     if (this._hasCCGlobal(config)) {
    //         result += fsExt.readFileSync(ps.join(__dirname, '../static/helper-global-exporter.txt'), 'utf8') + '\n';
    //     }

    //     // update value
    //     if (config[mode]) {
    //         config[mode].value = true;
    //     } else {
    //         console.warn(`Unknown mode: ${mode}`);
    //     }
    //     if (config[platform]) {
    //         config[platform].value = true;
    //     } else {
    //         console.warn(`Unknown platform: ${platform}`);
    //     }
    //     for (const key in flags) {
    //         const value = flags[key as FlagType]!;
    //         if (config[key]) {
    //             config[key].value = value;
    //         } else {
    //             console.warn(`Unknown flag: ${key}`);
    //         }
    //     }

    //     // eval value
    //     for (const key in config) {
    //         const info = config[key];
    //         if (typeof info.value === 'string') {
    //             info.value = this._evalExpression(info.value, config);
    //         }
    //     }

    //     // generate export content
    //     for (const key in config) {
    //         const info = config[key];
    //         const value = info.value;
    //         result += `export const ${key} = ${value};\n`;
    //         if (info.ccGlobal) {
    //             result += `tryDefineGlobal('CC_${key}', ${value});\n`
    //         }
    //         result += '\n';
    //     }

    //     return result;
    // }
    // //#endregion export string

    // //#region declaration
    // public genInternalConstants (): string {
    //     const config = this._getConfig();

    //     let result = `declare module 'internal:constants'{\n`;

    //     for (const name in config) {
    //         const info = config[name];
    //         result += this._genConstantDeclaration(name, info);
    //     }
    //     result += '}\n';

    //     return result;
    // }

    // public genCCEnv (): string {
    //     const config = this._getConfig();

    //     let result = `declare module 'cc/env'{\n`;

    //     for (const name in config) {
    //         const info = config[name];
    //         if (info.internal) {
    //             continue;
    //         }
    //         result += this._genConstantDeclaration(name, info);
    //     }
    //     result += '}\n';

    //     return result;
    // }
    
    // private _genConstantDeclaration (name: string, info: IConstantInfo): string {
    //     let result = '\t/**\n';
    //     let comments = info.comment.split('\n');
    //     for (const comment of comments) {
    //         result += `\t * ${comment}\n`;
    //     }
    //     result += '\t */\n';
    //     result += `\texport const ${name}: ${info.type};\n\n`
    //     return result;
    // }
    // //#endregion declaration

    // //#region utils
    // private _getConfig (): IConstantConfig {
    //     const engineConfig =  fsExt.readJsonSync(ps.join(this._engineRoot, './cc.config.json').replace(/\\/g, '/')) as Config;
    //     const config = engineConfig.constants;

    //     // init default value
    //     for (const key in config) {
    //         const info = config[key];
    //         if (typeof info.ccGlobal === 'undefined') {
    //             info.ccGlobal = false;
    //         }
    //         if (typeof info.dynamic === 'undefined') {
    //             info.dynamic = false;
    //         }
    //     }
    //     return config;
    // }

    // private _hasCCGlobal (config: IConstantConfig) {
    //     for (let key in config) {
    //         const info = config[key];
    //         if (info.ccGlobal) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // private _hasDynamic (config: IConstantConfig) {
    //     for (let key in config) {
    //         const info = config[key];
    //         if (info.dynamic) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // private _evalExpression (expression: string, config: IConstantConfig): boolean {
    //     // eval sub expression
    //     const matchResult = expression.match(/(?<=\$)\w+/g);
    //     if (matchResult) {
    //         for (let name of matchResult) {
    //             const value = config[name].value;
    //             if (typeof value === 'string') {
    //                 config[name].value = this._evalExpression(value, config);
    //             }
    //         }
    //     }
    //     // $EDITOR to $EDITOR.value
    //     expression = expression.replace(/(?<=\$)(\w+)/g, '$1.value');
    //     // $EDITOR to $.EDITOR.value
    //     expression = expression.replace(/\$/g, '$.');
    //     // do eval
    //     const evalFn = new Function('$', `return ${expression}`);
    //     return evalFn(config);
    // }

    // private _applyOptionsToConfig (config: IConstantConfig, options: ConstantOptions) {
    //     const { mode, platform, flags } = options;

    //     // update value
    //     if (config[mode]) {
    //         config[mode].value = true;
    //     } else {
    //         console.warn(`Unknown mode: ${mode}`);
    //     }
    //     if (config[platform]) {
    //         config[platform].value = true;
    //     } else {
    //         console.warn(`Unknown platform: ${platform}`);
    //     }
    //     for (const key in flags) {
    //         const value = flags[key as FlagType]!;
    //         if (config[key]) {
    //             config[key].value = value;
    //         } else {
    //             console.warn(`Unknown flag: ${key}`);
    //         }
    //     }

    //     // eval value
    //     for (const key in config) {
    //         const info = config[key];
    //         if (typeof info.value === 'string') {
    //             info.value = this._evalExpression(info.value, config);
    //         }
    //     }
    // }
    // //#endregion utils
}