
const dontmangle: PropertyDecorator = function (target, propertyKey) {};

import { ManglePropertyBase, MangleTestMyBaseEnum } from './mangle-private-base';

export enum MangleTestMyEnum {
    AAA,
    BBB,
    CCC = 123,
    DDD,
}

export enum MangleTestMyStringEnum {
    AAA = 'aaa',
    BBB = 'bbb',
    CCC = 'ccc',
}

export const enum MangleTestConstEnum {
    CONST_A = 1,
    CONST_B = 2,
    'space key',
    // eslint-disable-next-line quotes
    "space key2",
}

console.log(`MangleTestConstEnum.CONST_A: ${MangleTestConstEnum.CONST_A}`);
console.log(`MangleTestConstEnum.CONST_B: ${MangleTestConstEnum.CONST_B}`);
console.log(`MangleTestConstEnum['space key']: ${MangleTestConstEnum['space key']}`);
// eslint-disable-next-line quotes
console.log(`MangleTestConstEnum["space key2"]: ${MangleTestConstEnum["space key2"]}`);
export class ManglePrivatePropertiesTest extends ManglePropertyBase {
    private instanceProperty: string = '';
  
    private static staticProperty: string = '';
  
    private instanceMethod(): void {}
  
    private static staticMethod(): void {}

    private myProp0: number = 123;
    private myProp1: number = 456;

    @dontmangle
    private myProp222: number = 789;

    private myProp2: number;
    private myProp3;

    private declare myProp4: number;

    private _myEnum1: MangleTestMyEnum = MangleTestMyEnum.BBB;
    private _myEnum2: MangleTestMyEnum = MangleTestMyEnum.DDD;
    private _myStringEnum: MangleTestMyStringEnum = MangleTestMyStringEnum.CCC;
    private _myConstEnum: MangleTestConstEnum = MangleTestConstEnum.CONST_B;
    private _myConstEnum2: MangleTestConstEnum = MangleTestConstEnum['space key'];
    // eslint-disable-next-line quotes
    private _myConstEnum3: MangleTestConstEnum = MangleTestConstEnum["space key2"];

    get accessorProp0(): number {
        return this.myProp0;
    }

    set accessorProp0(value: number) {
        this.myProp0 = value;
    }

    constructor() {
        super();
        this.myProp2 = 123;
        this.myProp4 = 789;
    }

    private helloIntEnum(value: MangleTestMyEnum): void {
        console.log(value);
        this._myConstEnum3 = MangleTestConstEnum['space key'];
        this._myConstEnum2 = MangleTestConstEnum['space key2'];
    }

    private helloStringEnum(value: MangleTestMyStringEnum): void {
        console.log(value);
    }

    get myEnum1(): MangleTestMyEnum {
        return this._myEnum1;
    }

    get myEnum2(): MangleTestMyEnum {
        return this._myEnum2;
    }

    get myStringEnum(): MangleTestMyStringEnum {
        return this._myStringEnum;
    }

    public getFoo(): string {
        this.instanceMethod();
        ManglePrivatePropertiesTest.staticMethod();
        ManglePrivatePropertiesTest.staticProperty = 'bar';
        this._baseProtectedProp = 323;
        this._basePublicProp = 324;
        this._basePublicProp2 = 325;
        this.myProp222 = 0;
        this.myProp4 = 1;
        this.helloIntEnum(MangleTestMyEnum.AAA);
        this.helloStringEnum(MangleTestMyStringEnum.AAA);
        return this.instanceProperty;
    }

}

console.log(MangleTestMyBaseEnum.BABEL);
console.log(MangleTestMyBaseEnum.HELLO);
console.log(MangleTestMyBaseEnum.FOO);

export * from './mangle-private-base';

export const myTest = 1234;
