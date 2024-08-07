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

console.log(`MyEnum6.UNION.aaa`);
console.log(`MyEnum6.UNION`);
console.log(`   ${gfx.Format.RGBA}`);

console.log('' +(gfx.Format.RGBA | gfx.Format.RG));
console.log('' +(gfx.Format_2.RGBA | gfx.Format.RG));

export * from './script1';

export class MyNode {
    static Format = gfx.Format;
    static Format_2 = gfx.Format_2;
    private declare a: number;
    constructor(a: number) {
        this.a = a;
    }
}

console.log(MyNode.Format.RG);
console.log(MyNode.Format_2.RG);