
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

console.log(Format.UNKNOWN);
console.log(Format.A8);
console.log(Format.L8);
console.log(Format.LA8);
console.log(Format.R5G6B5);
console.log(Format.R11G11B10F);
console.log(Format.RGB5A1);
console.log(Format.RGBA4);
console.log(Format.RGB10A2);
console.log(Format.RGB10A2UI);
console.log(Format.RGB9E5);
console.log(Format.DEPTH);
console.log(Format.DEPTH_STENCIL);
console.log(Format.R);
console.log(Format.RG);
console.log(Format.RGB);
console.log(Format.RGBA);
console.log(Format.COUNT);


export enum Format_2 {
    R = Format.R,
    RG = Format.RG,
    RGB = Format.RGB,
    RGBA = Format.RGBA | R | RG,
    Haha = 134,
    www,
}

console.log(Format_2.R);
console.log(Format_2.RG, Format_2.RGB);
console.log(Format_2.RGBA);
console.log(Format_2.Haha);
console.log(Format_2.www);


export enum TransformBit {
    NONE = 0,
    POSITION = (1 << 0),
    ROTATION = (1 << 1),
    SCALE = (1 << 2),
    RS = TransformBit.ROTATION | TransformBit.SCALE,
    TRS = TransformBit.POSITION | TransformBit.ROTATION | TransformBit.SCALE,
    TRS_MASK = ~TransformBit.TRS,
}

console.log(TransformBit.NONE);
console.log(TransformBit.POSITION);
console.log(TransformBit.ROTATION);
console.log(TransformBit.SCALE);
console.log(TransformBit.RS);
console.log(TransformBit.TRS);
console.log(TransformBit.TRS_MASK);

export enum PixelFormat {
    RGB565 = Format.R5G6B5,
    A8 = Format.A8,
    I8 = Format.L8,
    AI8 = Format.LA8,
    RGB_A_PVRTC_2BPPV1 = CustomPixelFormat.VALUE,
    RGB_A_PVRTC_4BPPV1 = CustomPixelFormat.VALUE + 1,
    RGB_ETC1 = 123,
    RGBA_ETC1 = CustomPixelFormat.VALUE + 2,
    RGB_ETC2 = 123213,
    RGBA_ETC2,
}

console.log(PixelFormat.RGB565);
console.log(PixelFormat.A8);
console.log(PixelFormat.I8);
console.log(PixelFormat.AI8);
console.log(PixelFormat.RGB_A_PVRTC_2BPPV1);
console.log(PixelFormat.RGB_A_PVRTC_4BPPV1);
console.log(PixelFormat.RGB_ETC1);
console.log(PixelFormat.RGBA_ETC1);
console.log(PixelFormat.RGB_ETC2);
console.log(PixelFormat.RGBA_ETC2);


export enum TileFlag {
    /**
     * @property HORIZONTAL
     * @type {Number}
     * @static
     */
    HORIZONTAL = 0x80000000,

    /**
     * @property VERTICAL
     * @type {Number}
     * @static
     */
    VERTICAL = 0x40000000,

    /**
     * @property DIAGONAL
     * @type {Number}
     * @static
     */
    DIAGONAL = 0x20000000,

    /**
     * @property FLIPPED_ALL
     * @type {Number}
     * @static
     */
    FLIPPED_ALL = (0x80000000 | 0x40000000 | 0x20000000 | 0x10000000) >>> 0,

    /**
     * @property FLIPPED_MASK
     * @type {Number}
     * @static
     */
    FLIPPED_MASK = (~(0x80000000 | 0x40000000 | 0x20000000 | 0x10000000)) >>> 0
}

console.log(TileFlag.HORIZONTAL);
console.log(TileFlag.VERTICAL);
console.log(TileFlag.DIAGONAL);
console.log(TileFlag.FLIPPED_ALL);
console.log(TileFlag.FLIPPED_MASK);
