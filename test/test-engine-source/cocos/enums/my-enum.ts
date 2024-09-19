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

