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

export class ConfigParser {
    
}