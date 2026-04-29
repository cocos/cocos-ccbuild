export enum MinigamePlatform {
    WECHAT,
    WECHAT_MINI_PROGRAM,
    // /**
    //  * @deprecated this platform has been removed.
    //  */
    // BAIDU = 2,
    BYTEDANCE = 3, // Set BYTEDANCE to 3 to keep the compatibility after remove BAIDU platform
    ALIPAY = 5,
    TAOBAO,
    TAOBAO_MINIGAME,
    OPPO,
    VIVO,
    HUAWEI,
    // /**
    //  * @deprecated this platform has been removed.
    //  */
    // COCOSPLAY,
    // /**
    //  * @deprecated this platform has been removed.
    //  */
    // QTT,
    // /**
    //  * @deprecated this platform has been removed.
    //  */
    // LINKSURE,
    HONOR = 15, // Set HONOR to 15 to keep the compatibility after remove COCOSPLAY, QTT, LINKSURE platforms
    COCOS_RUNTIME,
    SUD,
    SUDV2
}

export enum NativePlatform {
    NATIVE_EDITOR,
    ANDROID,
    WINDOWS,
    IOS,
    MAC,
    OHOS,
    OPEN_HARMONY,
    LINUX,
}

export enum WebPlatform {
    WEB_EDITOR,
    WEB_MOBILE,
    WEB_DESKTOP,
}