import * as fs from 'fs-extra';
import * as ps from 'path';
import { Config } from './config-interface';

export type ValueType = number | boolean;

export type BuildTimeConstants = Record<PlatformType | keyof IFlagConfig, ValueType>;
export type CCEnvConstants = Record<PlatformType | keyof IPublicFlagConfig, ValueType>;

export type ConstantTypeName = 'boolean' | 'number';

export interface IConstantInfo {
    /**
     * The comment of the constant.
     * Which is used to generate the consts.d.ts file.
     */
    readonly comment: string;
    /**
     * The type of the constant for generating consts.d.ts file.
     */
    readonly type: ConstantTypeName;
    /**
     * The default value of the constant.
     * It can be a boolean, number or string.
     * When it's a string type, the value is the result of eval().
     */
    value: boolean | string | number,
    /**
     * Whether exported to global as a `CC_XXXX` constant.
     * eg. WECHAT is exported to global.CC_WECHAT
     * NOTE: this is a feature of compatibility with Cocos 2.x engine.
     * Default is false.
     * 
     * @default false
     */
    ccGlobal?: boolean,
    /**
     * Whether exported to developer.
     * If true, it's only exported to engine.
     */
    readonly internal: boolean,
    /**
     * Some constant can't specify the value in the Editor, Preview or Test environment,
     * so we need to dynamically judge them in runtime.
     * These values are specified in a helper called `helper-dynamic-constants.ts`.
     * Default is false.
     * 
     * @default false
     */
    dynamic?: boolean
}

export interface IConstantConfig {
    [ConstantName: string]: IConstantInfo;
}

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
    private _config: Config;
    constructor (configPath: string) {
        this._config = fs.readJsonSync(configPath) as Config;
    }
}