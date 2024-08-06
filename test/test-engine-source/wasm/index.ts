export * from './wasm-pack';
export * from './emscripten';

export enum MyEnum {
    AAA,
    BBB,
    CCC = 123,
    DDD = 'hello'
}

console.log(MyEnum.DDD);