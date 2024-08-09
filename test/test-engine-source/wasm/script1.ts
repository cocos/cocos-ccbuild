
enum CustomPixelFormat {
    VALUE = 1024,
}

export enum Format {

    UNKNOWN,

    A8,
    L8,
    LA8,

    // Special Format
    R5G6B5,
    R11G11B10F,
    RGB5A1,
    RGBA4,
    RGB10A2,
    RGB10A2UI,
    RGB9E5,

    // Depth-Stencil Format
    DEPTH,
    DEPTH_STENCIL,

    // Compressed Format


    R,
    RG,
    RGB,
    RGBA,

    // Total count
    COUNT,
}


export enum Format_2 {
    R = Format.R,
    RG = Format.RG,
    RGB = Format.RGB,
    RGBA = Format.RGBA | R | RG,
    Haha = 134,
    www,
}

/**
 * @en Bit masks for node's transformation
 * @zh 节点的空间变换位标记
 */
export enum TransformBit {
    /**
     * @en No change
     * @zh 无改变
     */
    NONE = 0,
    /**
     * @en Translation changed
     * @zh 节点位置改变
     */
    POSITION = (1 << 0),
    /**
     * @en Rotation changed
     * @zh 节点旋转
     */
    ROTATION = (1 << 1),
    /**
     * @en Scale changed
     * @zh 节点缩放
     */
    SCALE = (1 << 2),
    /**
     * @en Rotation or scale changed
     * @zh 节点旋转及缩放
     */
    RS = TransformBit.ROTATION | TransformBit.SCALE,
    /**
     * @en Translation, rotation or scale changed
     * @zh 节点平移，旋转及缩放
     */
    TRS = TransformBit.POSITION | TransformBit.ROTATION | TransformBit.SCALE,
    /**
     * @en Invert mask of [[TRS]]
     * @zh [[TRS]] 的反向掩码
     */
    TRS_MASK = ~TransformBit.TRS,
}

export enum PixelFormat {
    /**
     * @en
     * 16-bit pixel format containing red, green and blue channels
     * @zh
     * 包含 RGB 通道的 16 位纹理。
     */
    RGB565 = Format.R5G6B5,
    
    /**
     * @en
     * 8-bit pixel format used as masks
     * @zh
     * 用作蒙版的8位纹理。
     */
    A8 = Format.A8,
    /**
     * @en
     * 8-bit intensity pixel format
     * @zh
     * 8位强度纹理。
     */
    I8 = Format.L8,
    /**
     * @en
     * 16-bit pixel format used as masks
     * @zh
     * 用作蒙版的16位纹理。
     */
    AI8 = Format.LA8,

    /**
     * @en A pixel format containing red, green, blue, and alpha channels that is PVR 2bpp compressed.
     * RGB_A_PVRTC_2BPPV1 texture is a 2x height RGB_PVRTC_2BPPV1 format texture.
     * It separate the origin alpha channel to the bottom half atlas, the origin rgb channel to the top half atlas.
     * @zh 包含 RGBA 通道的 PVR 2BPP 压缩纹理格式
     * 这种压缩纹理格式贴图的高度是普通 RGB_PVRTC_2BPPV1 贴图高度的两倍，使用上半部分作为原始 RGB 通道数据，下半部分用来存储透明通道数据。
     */
    RGB_A_PVRTC_2BPPV1 = CustomPixelFormat.VALUE,

    /**
     * @en A pixel format containing red, green, blue, and alpha channels that is PVR 4bpp compressed.
     * RGB_A_PVRTC_4BPPV1 texture is a 2x height RGB_PVRTC_4BPPV1 format texture.
     * It separate the origin alpha channel to the bottom half atlas, the origin rgb channel to the top half atlas.
     * @zh 包含 RGBA 通道的 PVR 4BPP 压缩纹理格式
    * 这种压缩纹理格式贴图的高度是普通 RGB_PVRTC_4BPPV1 贴图高度的两倍，使用上半部分作为原始 RGB 通道数据，下半部分用来存储透明通道数据。
     */
    RGB_A_PVRTC_4BPPV1 = CustomPixelFormat.VALUE + 1,
    /**
     * @en A pixel format containing red, green, and blue channels that is ETC1 compressed.
     * @zh 包含 RGB 通道的 ETC1 压缩纹理格式
     */
    RGB_ETC1 = 123,
    /**
     * @en A pixel format containing red, green, blue, and alpha channels that is ETC1 compressed.
     * @zh 包含 RGBA 通道的 ETC1 压缩纹理格式
     */
    RGBA_ETC1 = CustomPixelFormat.VALUE + 2,
    /**
     * @en A pixel format containing red, green, and blue channels that is ETC2 compressed.
     * @zh 包含 RGB 通道的 ETC2 压缩纹理格式
     */
    RGB_ETC2 = 123213,
    /**
     * @en A pixel format containing red, green, blue, and alpha channels that is ETC2 compressed.
     * @zh 包含 RGBA 通道的 ETC2 压缩纹理格式
     */
    RGBA_ETC2,

}