
const dontmangle: PropertyDecorator = function (target, propertyKey) {};

import { IMangleGrand, IMangleTest, ManglePropertyBase, ManglePropertyGrand, MangleTestMyBaseEnum } from './mangle-private-base';

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
export class ManglePrivatePropertiesTest extends ManglePropertyBase implements IMangleTest {
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


    /**
     * @mangle
     * @engineInternal
     * This is a public property in internal modules, so we need to mangle it 
     * to reduce package size.
     */
    public publicProp1 = 123;

    /** 
     * @mangle
     * @engineInternal
     * This is a public property in internal modules, so we need to mangle it
     */
    publicProp2 = 'hello';

    // @mangle
    // @engineInternal
    // This is a public property in internal modules, so we need to mangle it
    public declare publicProp3: number;

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
        this.publicProp3 = 456;
        this.dontMangleMeProp2 = 'world';
        this.dontMangleMe2();
        
    }

    helloInterface1(): void {

    }
    helloInterface2(v: string): number {
        return v.length;
    }
    
    interfaceProp1 = 1;
    interfaceProp2 = '2';

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
        this._basePublicProp1Mangle = 324;
        this._basePublicProp2DontMangle = 325;
        this.myProp222 = 0;
        this.myProp4 = 1;
        this.helloIntEnum(MangleTestMyEnum.AAA);
        this.helloStringEnum(MangleTestMyStringEnum.AAA);
        return this.instanceProperty;
    }

    helloGrandMangleInMangleList(): void {
        super.helloGrandMangleInMangleList();
    }

    helloGrandDontMangle1(): void {
        super.helloGrandDontMangle1();
        this._grandProtectedPropDontMangle = 0;
        this._grandProtectedPropMangle = 2;
    }

    protected helloGrandAbstractMangleMe(): void {
        super.helloGrandAbstractMangleMe();
    }

    protected helloGrandMangleMeProtected(): void {
        super.helloGrandMangleMeProtected();
    }
}

console.log(MangleTestMyBaseEnum.BABEL);
console.log(MangleTestMyBaseEnum.HELLO);
console.log(MangleTestMyBaseEnum.FOO);

function doManglePrivatePropertiesTestPublic(obj: ManglePrivatePropertiesTest): void {
    console.log(`--------------------------`);
    obj.publicProp1 = 456;
    obj.publicProp2 = 'world';
    obj.publicProp3 = 789;
    obj._basePublicProp1Mangle = 100;
    obj._basePublicProp2DontMangle = 200;
    obj.basePublicMethod();
    obj.declarePropMangle = 'world';

    console.log(`--------------------------`);
    const base: ManglePropertyBase = obj;
    base._basePublicProp1Mangle = 101;
    base._basePublicProp2DontMangle = 201;
    base.basePublicMethod();
    base.declarePropMangle = 'hello';

    console.log(`--------------------------`);
    obj.helloInterface1();
    obj.helloInterface2('world');
    obj.interfaceProp1 = 12344;
    obj.interfaceProp2 = 'world33';

    console.log(`--------------------------`);
    const intf: IMangleTest = obj;
    intf.helloInterface1();
    intf.helloInterface2('world');
    if (intf.helloInterface3) {
        intf.helloInterface3('world');
    }
    intf.interfaceProp1 = 123;
    intf.interfaceProp2 = 'world';
    intf.interfaceProp3 = true;

    console.log(`--------------------------`);
    obj.grandPropDontMangle = obj.grandPropDontMangle + 1;
    obj.grandPublicPropMangle = obj.grandPublicPropMangle + 1;
    obj.helloGrandDontMangle1();
    obj.helloGrandDontMangleMe();
    obj.helloGrandMangleMe3();
    obj.helloGrandMangleMePublic();
    obj.iGrandPropMangle = obj.iGrandPropMangle + 1;
    obj.iGrandPublicPropMangleJsDocButInDontMangleList = obj.iGrandPublicPropMangleJsDocButInDontMangleList + 1;
    
    console.log(`--------------------------`);
    const grand: ManglePropertyGrand = obj;
    grand.grandPropDontMangle = grand.grandPropDontMangle + 1;
    grand.grandPublicPropMangle = grand.grandPublicPropMangle + 1;
    grand.helloGrandDontMangle1();
    grand.helloGrandDontMangleMe();
    grand.helloGrandMangleMe3();
    grand.helloGrandMangleMePublic();
    grand.iGrandPropMangle = grand.iGrandPropMangle + 1;
    grand.iGrandPublicPropMangleJsDocButInDontMangleList = grand.iGrandPublicPropMangleJsDocButInDontMangleList + 1;

    console.log(`--------------------------`);
    const iGrand: IMangleGrand = obj;
    iGrand.helloGrandDontMangle1();
    iGrand.helloGrandMangleMe3();
    iGrand.iGrandPublicPropMangleMe = iGrand.iGrandPublicPropMangleMe + 1;
    iGrand.iGrandPropMangle = iGrand.iGrandPropMangle + 1;
    iGrand.iGrandPublicPropMangleJsDocButInDontMangleList = iGrand.iGrandPublicPropMangleJsDocButInDontMangleList + 1;
}
doManglePrivatePropertiesTestPublic(new ManglePrivatePropertiesTest());

((obj: ManglePrivatePropertiesTest) => {
    obj._mangleMeProp = 333;
    obj._mangleMeProp2 = 'world';
    obj.dontMangleMeProp3 = 444;
    obj.mangleMe();
    obj.mangleMe2();
    obj.dontMangleMe3();

})(new ManglePrivatePropertiesTest);

(() => {
    console.log(`test interface 2`);
    const intf: IMangleTest = {
        helloInterface1() {},
        helloInterface2() { return 0; },
        interfaceProp1: 123,
        interfaceProp2: 'world',
        interfaceProp3: true,
    };

    intf.helloInterface1();
    intf.helloInterface2('world');
    if (intf.helloInterface3) {
        intf.helloInterface3('world');
    }
    intf.interfaceProp1 = 123;
    intf.interfaceProp2 = 'world';
    intf.interfaceProp3 = true;
})();

export * from './mangle-private-base';

