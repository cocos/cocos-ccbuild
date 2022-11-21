export type IConstantValue = boolean | number | string;

export interface IPlatformConfig {
    HTML5: IConstantValue; 
    NATIVE: IConstantValue; 
    WECHAT: IConstantValue; 
    BAIDU: IConstantValue; 
    XIAOMI: IConstantValue; 
    ALIPAY: IConstantValue; 
    BYTEDANCE: IConstantValue; 
    OPPO: IConstantValue; 
    VIVO: IConstantValue; 
    HUAWEI: IConstantValue; 
    COCOSPLAY: IConstantValue; 
    QTT: IConstantValue; 
    LINKSURE: IConstantValue;
    OPEN_HARMONY: IConstantValue;
}

interface IInternalFlagConfig extends IFlagConfig {
    SERVER_MODE: IConstantValue; 
    NOT_PACK_PHYSX_LIBS: IConstantValue; 
    WEBGPU: IConstantValue;
}

export interface IFlagConfig {
    DEBUG: IConstantValue;
    NET_MODE: IConstantValue; 
    EDITOR: IConstantValue; 
    PREVIEW: IConstantValue; 
    BUILD: IConstantValue; 
    TEST: IConstantValue;
}

export class ConfigParser {
    
}