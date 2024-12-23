export enum MyEnum {
    AAA,
    BBB,
    CCC = 123,
    DDD = 'hello',
    EEE = BBB,
}

console.log(MyEnum.AAA);
console.log(MyEnum.BBB);
console.log(MyEnum.CCC);
console.log(MyEnum.DDD);
console.log(MyEnum.EEE);

export const enum MyConstEnum {
    C_AAA,
    C_BBB,
    C_DDD = MyEnum.DDD,
    C_EEE = 1234,
    C_FFF,
}

console.log(MyConstEnum.C_AAA, MyConstEnum.C_BBB);
console.log(MyConstEnum.C_DDD, MyConstEnum.C_EEE);
console.log(MyConstEnum.C_FFF, MyConstEnum.C_AAA);

export function testConstantOfTypeArray(): void {
    console.log('Float32Array.BYTES_PER_ELEMENT:' + Float32Array.BYTES_PER_ELEMENT);
    console.log('Float64Array.BYTES_PER_ELEMENT:' + Float64Array.BYTES_PER_ELEMENT);
    console.log('Uint8Array.BYTES_PER_ELEMENT:' + Uint8Array.BYTES_PER_ELEMENT);
    console.log('Uint8ClampedArray.BYTES_PER_ELEMENT:' + Uint8ClampedArray.BYTES_PER_ELEMENT);
    console.log('Uint16Array.BYTES_PER_ELEMENT:' + Uint16Array.BYTES_PER_ELEMENT);
    console.log('Uint32Array.BYTES_PER_ELEMENT:' + Uint32Array.BYTES_PER_ELEMENT);
    console.log('Int8Array.BYTES_PER_ELEMENT:' + Int8Array.BYTES_PER_ELEMENT);
    console.log('Int16Array.BYTES_PER_ELEMENT:' + Int16Array.BYTES_PER_ELEMENT);
    console.log('Int32Array.BYTES_PER_ELEMENT:' + Int32Array.BYTES_PER_ELEMENT);

    console.log(`Int32Array.BYTES_PER_ELEMENT: ${Int32Array.BYTES_PER_ELEMENT}`);
}
