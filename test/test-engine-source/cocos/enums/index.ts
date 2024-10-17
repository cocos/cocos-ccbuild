import { MyConstEnum, MyEnum } from './my-enum';

import * as gfx from './define';

import { PixelFormat } from './define';

import './test-override-entry';

export enum MyEnum2 {
    AAABBB,
    Haha = MyEnum.AAA,
    Hi = MyEnum.CCC,
}

console.log(MyEnum2.AAABBB);
console.log(MyEnum2.Haha);
console.log(MyEnum2.Hi);


export enum MyEnum3 {
    WEBGL = MyEnum.BBB << 4,
    WEBGPU,
    WEBGL2,
}

console.log(MyEnum3.WEBGL);
console.log(MyEnum3.WEBGPU);
console.log(MyEnum3.WEBGL2);

console.log(MyEnum.DDD);

console.log(MyEnum2.Hi);

console.log(`hello: ${MyEnum3.WEBGPU}`);

export enum MyEnum5 {
    RGB = gfx.Format.RGB,
    RGBA = gfx.Format.RGBA,
    III,
    HHH,
    WWW = 4,
    ZZZ,
    UUU = MyConstEnum.C_EEE,
    EEE,
}

console.log(MyEnum5.RGB);
console.log(MyEnum5.RGBA);
console.log(MyEnum5.III);
console.log(MyEnum5.HHH);
console.log(MyEnum5.WWW);
console.log(MyEnum5.ZZZ);
console.log(MyEnum5.UUU);
console.log(MyEnum5.EEE);

export enum MyEnum6 {
    UNION = gfx.Format.R | gfx.Format.RG,
}

console.log(MyEnum6.UNION);

console.log(`MyEnum6.UNION.aaa`);
console.log(`MyEnum6.UNION`);
console.log(`   ${gfx.Format.RGBA}`);

console.log('' +(gfx.Format.RGBA | gfx.Format.RG));
console.log('' +(gfx.Format_2.RGBA | gfx.Format.RG));

export * from './define';

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

console.log(gfx.PixelFormat.A8);
console.log(PixelFormat.A8);
console.log(PixelFormat.RGB_A_PVRTC_2BPPV1);

console.log('---- const enum begin ----');

console.log(MyConstEnum.C_AAA, MyConstEnum.C_BBB);
console.log(MyConstEnum.C_DDD, MyConstEnum.C_EEE);
console.log(MyConstEnum.C_FFF, MyConstEnum.C_AAA);

console.log('---- const enum end ----');

