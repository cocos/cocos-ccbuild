import { MyEnum } from './emscripten';

import * as gfx from './script1';

export * from './wasm-pack';
export * from './emscripten';

export enum MyEnum2 {
    AAABBB,
    Haha = MyEnum.AAA,
    Hi = MyEnum.CCC,
}

export enum MyEnum3 {
    WEBGL = MyEnum.BBB << 4,
    WEBGPU,
    WEBGL2,
}

console.log(MyEnum.DDD);

console.log(MyEnum2.Hi);

console.log(`hello: ${MyEnum3.WEBGPU}`);


export enum MyEnum5 {
    RGB = gfx.Format.RGB,
    RGBA = gfx.Format.RGBA,
    III,
    HHH,
    WWW = 123,
    ZZZ,
}

export enum MyEnum6 {
    UNION = gfx.Format.R | gfx.Format.RG,
}

console.log(MyEnum6.UNION);
console.log(gfx.Format.RGB);

export * from './script1';
