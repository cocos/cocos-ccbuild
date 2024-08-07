
export enum Format {
    R =1,
    RG = 1 << 1,
    RGB = 1 << 2,
    RGBA = 1 << 3,
}


export enum Format_2 {
    R = Format.R,
    RG = Format.RG,
    RGB = Format.RGB,
    RGBA = Format.RGBA | R | RG,
    Haha = 134,
    www,
}