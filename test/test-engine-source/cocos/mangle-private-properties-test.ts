import { IMangleGrand, IMangleTest, IWebGLBindingMapping, IWebGLGPUShader, IWebGLGPUTexture, IWebGLGPUTexture2, IWebGLGPUTexture3, IWebGLGPUTexture4, ManglePropertyBase, ManglePropertyGrand, MangleTestMyBaseEnum, MangleWholeClass, MyClassExtendsMangleWholeClass } from './mangle-private-base';

const dontmangle: PropertyDecorator = function (target, propertyKey) {};

export * from './mangle-private-base';

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
        this.mangleTagInBaseButDontmangleTagInSub();
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
    obj.mangleTagInBaseButDontmangleTagInSub();

    console.log(`--------------------------`);
    const base: ManglePropertyBase = obj;
    base._basePublicProp1Mangle = 101;
    base._basePublicProp2DontMangle = 201;
    base.basePublicMethod();
    base.declarePropMangle = 'hello';
    base.mangleTagInBaseButDontmangleTagInSub();

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

    console.log(`--------------------------`);
    const { helloInterface1, helloInterface2, helloInterface3, interfaceProp1, interfaceProp2, interfaceProp3 } = intf;
    helloInterface1();
    helloInterface2('world');
    if (helloInterface3) helloInterface3('world');
    console.log(interfaceProp1);
    console.log(interfaceProp2);
    console.log(interfaceProp3);

})();

(() => {
    const a: IWebGLBindingMapping = {
        blockOffsets: [],
        samplerTextureOffsets: [],
        flexibleSet: 0
    };
    console.log(a.blockOffsets, a.samplerTextureOffsets, a.flexibleSet);

    console.log(`--------------------------`);
    const b = new MangleWholeClass();
    b.mangleWholeClassPublicProp1 = 456;
    b.getMangleWholeClassPrivateProp3();
    b.helloMangleWholeClassPublicMethod1();

    console.log(`--------------------------`);
    const c = new MyClassExtendsMangleWholeClass();
    c.mangleWholeClassPublicProp1 = 456;
    c.getMangleWholeClassPrivateProp3();
    c.helloMangleWholeClassPublicMethod1();
    c.helloSubclassExtendsMangleWholeMethod1();
    c.getSubclassExtendsMangleWholeProp1();
    c.helloMangleWholeClassBasePublicMethod1();
    c.helloMangleWholeClassInterfaceMethod1();
    c.iMangleWholeClassInterfaceProp1 = 2;
    c.iMangleWholeClassInterfaceProp2 = 'world';
})();


(() => {
    console.log(`-------------------------- IWebGLGPUTexture --------------------------`);
    const width = 123;
    let aaaaaaaaa: IWebGLGPUTexture | undefined;
    aaaaaaaaa = undefined;
    aaaaaaaaa = {
        width,
        height: width,
        depth: width,
        size: 0,
        arrayLayer: 0,
        mipLevel: 0,
        isPowerOf2: false,
        glTarget: 0,
        glInternalFmt: 0,
        glFormat: 0,
        glType: 0,
        glUsage: 0,
        glTexture: null,
        glRenderbuffer: null,
        glWrapS: 0,
        glWrapT: 0,
        glMinFilter: 0,
        glMagFilter: 0,
        isSwapchainTexture: false,

        get widthGetter(): number { return 1; },
        set widthSetter(value: number) {},

        helloMangle(): void {},

        helloDontMangle(): void {},
    };
    console.log(aaaaaaaaa.width);
    console.log(aaaaaaaaa.height);
    console.log(aaaaaaaaa.depth);
    console.log(aaaaaaaaa.size);
    console.log(aaaaaaaaa.arrayLayer);
    console.log(aaaaaaaaa.mipLevel);
    console.log(aaaaaaaaa.isPowerOf2);
    console.log(aaaaaaaaa.glTarget);
    console.log(aaaaaaaaa.glInternalFmt);
    console.log(aaaaaaaaa.glFormat);
    console.log(aaaaaaaaa.glType);
    console.log(aaaaaaaaa.glUsage);
    console.log(aaaaaaaaa.glTexture);
    console.log(aaaaaaaaa.glRenderbuffer);
    console.log(aaaaaaaaa.glWrapS);
    console.log(aaaaaaaaa.glWrapT);
    console.log(aaaaaaaaa.glMinFilter);
    console.log(aaaaaaaaa.glMagFilter);
    console.log(aaaaaaaaa.isSwapchainTexture);
    console.log(aaaaaaaaa.widthGetter);
    console.log(aaaaaaaaa.widthSetter);
    console.log(aaaaaaaaa.helloMangle());
    console.log(aaaaaaaaa.helloDontMangle());
})();

(() => {
    console.log(`-------------------------- IWebGLGPUTexture1 --------------------------`);
    const width = 123;
    const a: IWebGLGPUTexture = {
        width,
        height: 0,
        depth: 0,
        size: 0,
        arrayLayer: 0,
        mipLevel: 0,
        isPowerOf2: false,
        glTarget: 0,
        glInternalFmt: 0,
        glFormat: 0,
        glType: 0,
        glUsage: 0,
        glTexture: null,
        glRenderbuffer: null,
        glWrapS: 0,
        glWrapT: 0,
        glMinFilter: 0,
        glMagFilter: 0,
        isSwapchainTexture: false,
        get widthGetter(): number { return 1; },
        set widthSetter(value: number) {},

        helloMangle(): void {},

        helloDontMangle(): void {},
    };
    console.log(a.width);
    console.log(a.height);
    console.log(a.depth);
    console.log(a.size);
    console.log(a.arrayLayer);
    console.log(a.mipLevel);
    console.log(a.isPowerOf2);
    console.log(a.glTarget);
    console.log(a.glInternalFmt);
    console.log(a.glFormat);
    console.log(a.glType);
    console.log(a.glUsage);
    console.log(a.glTexture);
    console.log(a.glRenderbuffer);
    console.log(a.glWrapS);
    console.log(a.glWrapT);
    console.log(a.glMinFilter);
    console.log(a.glMagFilter);
    console.log(a.isSwapchainTexture);
    console.log(a.widthGetter);
    console.log(a.widthSetter);
    console.log(a.helloMangle());
    console.log(a.helloDontMangle());
})();

(() => {
    console.log(`-------------------------- IWebGLGPUTexture2 --------------------------`);
    const width = 123;
    let aaaaaaaaa: IWebGLGPUTexture2 | undefined;
    aaaaaaaaa = undefined;
    aaaaaaaaa = {
        width,
        height: 0,
        depth: 0,
        size: 0,
        arrayLayer: 0,
        mipLevel: 0,
        isPowerOf2: false,
        glTarget: 0,
        glInternalFmt: width,
        glFormat: 0,
        glType: 0,
        glUsage: 0,
        glTexture: null,
        glRenderbuffer: null,
        glWrapS: 0,
        glWrapT: 0,
        glMinFilter: 0,
        glMagFilter: 0,
        isSwapchainTexture: false,
        get widthGetter(): number { return 1; },
        set widthSetter(value: number) {},
    };
    console.log(aaaaaaaaa.width);
    console.log(aaaaaaaaa.height);
    console.log(aaaaaaaaa.depth);
    console.log(aaaaaaaaa.size);
    console.log(aaaaaaaaa.arrayLayer);
    console.log(aaaaaaaaa.mipLevel);
    console.log(aaaaaaaaa.isPowerOf2);
    console.log(aaaaaaaaa.glTarget);
    console.log(aaaaaaaaa.glInternalFmt);
    console.log(aaaaaaaaa.glFormat);
    console.log(aaaaaaaaa.glType);
    console.log(aaaaaaaaa.glUsage);
    console.log(aaaaaaaaa.glTexture);
    console.log(aaaaaaaaa.glRenderbuffer);
    console.log(aaaaaaaaa.glWrapS);
    console.log(aaaaaaaaa.glWrapT);
    console.log(aaaaaaaaa.glMinFilter);
    console.log(aaaaaaaaa.glMagFilter);
    console.log(aaaaaaaaa.isSwapchainTexture);
    console.log(aaaaaaaaa.widthGetter);
    console.log(aaaaaaaaa.widthSetter);
})();

(() => {
    console.log(`-------------------------- IWebGLGPUTexture3 --------------------------`);
    const width = 123;
    let aaaaaaaaa: IWebGLGPUTexture3 | undefined;
    aaaaaaaaa = undefined;
    aaaaaaaaa = {
        width,
        height: 0,
        depth: 0,
        size: 0,
        arrayLayer: 0,
        mipLevel: 0,
        isPowerOf2: false,
        glTarget: 0,
        glInternalFmt: 0,
        glFormat: 0,
        glType: width,
        glUsage: 0,
        glTexture: null,
        glRenderbuffer: null,
        glWrapS: 0,
        glWrapT: 0,
        glMinFilter: 0,
        glMagFilter: 0,
        isSwapchainTexture: false
    };
    console.log(aaaaaaaaa.width);
    console.log(aaaaaaaaa.height);
    console.log(aaaaaaaaa.depth);
    console.log(aaaaaaaaa.size);
    console.log(aaaaaaaaa.arrayLayer);
    console.log(aaaaaaaaa.mipLevel);
    console.log(aaaaaaaaa.isPowerOf2);
    console.log(aaaaaaaaa.glTarget);
    console.log(aaaaaaaaa.glInternalFmt);
    console.log(aaaaaaaaa.glFormat);
    console.log(aaaaaaaaa.glType);
    console.log(aaaaaaaaa.glUsage);
    console.log(aaaaaaaaa.glTexture);
    console.log(aaaaaaaaa.glRenderbuffer);
    console.log(aaaaaaaaa.glWrapS);
    console.log(aaaaaaaaa.glWrapT);
    console.log(aaaaaaaaa.glMinFilter);
    console.log(aaaaaaaaa.glMagFilter);
    console.log(aaaaaaaaa.isSwapchainTexture);
})();

(() => {
    console.log(`-------------------------- IWebGLGPUTexture4 --------------------------`);
    const width = 123;
    let aaaaaaaaa: IWebGLGPUTexture4 | undefined;
    aaaaaaaaa = undefined;
    aaaaaaaaa = {
        width,
        height: 0,
        depth: 0,
        size: 0,
        arrayLayer: 0,
        mipLevel: 0,
        isPowerOf2: false,
        glTarget: 0,
        glInternalFmt: 0,
        glFormat: 0,
        glType: 0,
        glUsage: width,
        glTexture: null,
        glRenderbuffer: null,
        glWrapS: 0,
        glWrapT: 0,
        glMinFilter: 0,
        glMagFilter: 0,
        isSwapchainTexture: false,
        get widthGetter(): number { return 1; },
    };
    console.log(aaaaaaaaa.width);
    console.log(aaaaaaaaa.height);
    console.log(aaaaaaaaa.depth);
    console.log(aaaaaaaaa.size);
    console.log(aaaaaaaaa.arrayLayer);
    console.log(aaaaaaaaa.mipLevel);
    console.log(aaaaaaaaa.isPowerOf2);
    console.log(aaaaaaaaa.glTarget);
    console.log(aaaaaaaaa.glInternalFmt);
    console.log(aaaaaaaaa.glFormat);
    console.log(aaaaaaaaa.glType);
    console.log(aaaaaaaaa.glUsage);
    console.log(aaaaaaaaa.glTexture);
    console.log(aaaaaaaaa.glRenderbuffer);
    console.log(aaaaaaaaa.glWrapS);
    console.log(aaaaaaaaa.glWrapT);
    console.log(aaaaaaaaa.glMinFilter);
    console.log(aaaaaaaaa.glMagFilter);
    console.log(aaaaaaaaa.isSwapchainTexture);
    console.log(aaaaaaaaa.widthGetter);
})();

(() => {
    console.log(`-------------------------- IWebGLGPUTexture in class --------------------------`);
    const width = 123;
    class MyTexture {
        get gpuTexture(): IWebGLGPUTexture {
            return this._gpuTexture;
        }

        private _gpuTexture!: IWebGLGPUTexture;

        init(): this {
            this._gpuTexture = {
                width,
                height: 0,
                depth: 0,
                size: 0,
                arrayLayer: 0,
                mipLevel: 0,
                isPowerOf2: false,
                glTarget: 0,
                glInternalFmt: 0,
                glFormat: 0,
                glType: width,
                glUsage: 0,
                glTexture: null,
                glRenderbuffer: null,
                glWrapS: 0,
                glWrapT: 0,
                glMinFilter: 0,
                glMagFilter: 0,
                isSwapchainTexture: false,
                
                get widthGetter(): number { return 1; },
                set widthSetter(value: number) {},

                helloMangle(): void {},

                helloDontMangle(): void {},
            };
            return this;
        }
    }

    const tex = new MyTexture().init();
    const aaaaaaaaa = tex.gpuTexture;
    console.log(aaaaaaaaa.width);
    console.log(aaaaaaaaa.height);
    console.log(aaaaaaaaa.depth);
    console.log(aaaaaaaaa.size);
    console.log(aaaaaaaaa.arrayLayer);
    console.log(aaaaaaaaa.mipLevel);
    console.log(aaaaaaaaa.isPowerOf2);
    console.log(aaaaaaaaa.glTarget);
    console.log(aaaaaaaaa.glInternalFmt);
    console.log(aaaaaaaaa.glFormat);
    console.log(aaaaaaaaa.glType);
    console.log(aaaaaaaaa.glUsage);
    console.log(aaaaaaaaa.glTexture);
    console.log(aaaaaaaaa.glRenderbuffer);
    console.log(aaaaaaaaa.glWrapS);
    console.log(aaaaaaaaa.glWrapT);
    console.log(aaaaaaaaa.glMinFilter);
    console.log(aaaaaaaaa.glMagFilter);
    console.log(aaaaaaaaa.isSwapchainTexture);
    console.log(aaaaaaaaa.widthGetter);
    console.log(aaaaaaaaa.widthSetter);
    console.log(aaaaaaaaa.helloMangle());
    console.log(aaaaaaaaa.helloDontMangle());

})();


(() => {
    const gpuShader: IWebGLGPUShader = {
        name: '',
        gpuStages: [{
            source: '1',
            glShader: null,
        }, {
            source: '2',
            glShader: null,
        }],
        gpuStageMap: {
            hello: {
                source: '1',
                glShader: null,
            },
            world: {
                source: '2',
                glShader: null,
            }
        }
    };
    console.log(gpuShader.name);
    console.log(gpuShader.gpuStages[0].glShader);
    console.log(gpuShader.gpuStages[0].source);
})();

(() => {
    let gpuShader: IWebGLGPUShader | undefined;
    gpuShader = undefined;
    gpuShader = {
        name: '',
        gpuStages: [{
            source: '1',
            glShader: null,
        }, {
            source: '2',
            glShader: null,
        }],
        gpuStageMap: {
            hello: {
                source: '1',
                glShader: null,
            },
            world: {
                source: '2',
                glShader: null,
            }
        }
    };
    console.log(gpuShader.name);
    console.log(gpuShader.gpuStages[0].glShader);
    console.log(gpuShader.gpuStages[0].source);
})();

/** @mangle */
export interface IUnionBase1 {
    ia: number;
    ib: string;
}

/** @mangle */
export interface IUnionBase2 {
    ic: boolean;
    id: number;
}

/** @mangle */
export interface IUnionBase3 {
    ie: IUnionBase1 | IUnionBase2;
}

(() => {
    const a: IUnionBase1 = {
        ia: 1,
        ib: 'world',
    };
    const b: IUnionBase3 = {
        ie: a,
    };
    console.log(a.ia);
    console.log(a.ib);
    console.log(b.ie);

    if ('ia' in b.ie) {
        console.log(b.ie.ia);
        console.log(b.ie.ib);
    } else {
        console.log(b.ie.ic);
        console.log(b.ie.id);
    }

})();

(() => {
    const a: IUnionBase2[] = [];
    a.push({
        ic: true,
        id: 1,
    });
    const b: IUnionBase2 = {
        ic: false,
        id: 2,
    };
    a.push(b);
    console.log(a[0].ic);
    console.log(a[0].id);
    console.log(a[1].ic);
    console.log(a[1].id);
})();


class GenerateConstructorTestBase {
    hello(): void {
        console.log('hello');
    }
}

class GenerateConstructorTest extends GenerateConstructorTestBase {
    world(): void {
        console.log('world');
    }
}

const generateConstructorTest = new GenerateConstructorTest();
generateConstructorTest.hello();
generateConstructorTest.world();


class MangleStaticPropertyTest {
    static prop_a_dontmangle: number = 1;
    protected static prop_b_dontmangle: string = 'world';
    private static prop_c_mangle: boolean = false;

    /** @mangle */
    public static prop_d_mangle: number = 2;

    static prop_e_mangle_by_config: number = 3;
    private static prop_f_dontmangle_by_config: number = 4;

    private static mangleMe1(): void {
        console.log('MangleStaticPropertyTest.mangleMe1');
    }

    protected static dontMangleMe2(): void {
        console.log('MangleStaticPropertyTest.dontMangleMe2');
    }

    static dontMangleMe3(): void {
        console.log('MangleStaticPropertyTest.dontMangleMe3');
    }

    /** @mangle */
    static mangleMe(): void {
        console.log('MangleStaticPropertyTest.mangleMe');
    }

    static mangleMeByConfig(): void {
        console.log('MangleStaticPropertyTest.mangleMeByConfig');
    }

    private static dontMangleMeByConfig(): void {
        console.log('MangleStaticPropertyTest.dontMangleMeByConfig');
    }

    private static get static_get_set_should_mangle(): number {
        return 1;
    }

    private static set static_get_set_should_mangle(value: number) {
        console.log(value);
    }

    /** @mangle */
    public static get static_get_set_should_mangle2(): number {
        return 1;
    }

    public static set static_get_set_should_mangle2(value: number) {
        console.log(value);
    }

    static get static_get_set_should_mangle_by_config(): number {
        return 1;
    }

    static set static_get_set_should_mangle_by_config(value: number) {
        console.log(value);
    }

    private static get static_get_set_dont_mangle_by_config(): number {
        return 1;
    }

    private static set static_get_set_dont_mangle_by_config(value: number) {
        console.log(value);
    }

    public static helloTestMangleStaticProp(): void {
        MangleStaticPropertyTest.mangleMe1();
        MangleStaticPropertyTest.dontMangleMe2();
        MangleStaticPropertyTest.dontMangleMe3();
        MangleStaticPropertyTest.mangleMe();
        MangleStaticPropertyTest.mangleMeByConfig();
        MangleStaticPropertyTest.dontMangleMeByConfig();
        MangleStaticPropertyTest.prop_a_dontmangle = 2;
        MangleStaticPropertyTest.prop_b_dontmangle = 'hello';
        MangleStaticPropertyTest.prop_c_mangle = true;
        MangleStaticPropertyTest.prop_d_mangle = 12;
        MangleStaticPropertyTest.prop_e_mangle_by_config = 4;
        MangleStaticPropertyTest.prop_f_dontmangle_by_config = 5;
        MangleStaticPropertyTest.static_get_set_should_mangle = 123;
        MangleStaticPropertyTest.static_get_set_should_mangle2 = 123;

        console.log(`MangleStaticPropertyTest.prop_a_dontmangle: ${MangleStaticPropertyTest.prop_a_dontmangle}`);
        console.log(`MangleStaticPropertyTest.prop_b_dontmangle: ${MangleStaticPropertyTest.prop_b_dontmangle}`);
        console.log(`MangleStaticPropertyTest.prop_c_mangle: ${MangleStaticPropertyTest.prop_c_mangle}`);
        console.log(`MangleStaticPropertyTest.prop_d_mangle: ${MangleStaticPropertyTest.prop_d_mangle}`);
        console.log(`MangleStaticPropertyTest.prop_e_mangle_by_config: ${MangleStaticPropertyTest.prop_e_mangle_by_config}`);
        console.log(`MangleStaticPropertyTest.prop_f_dontmangle_by_config: ${MangleStaticPropertyTest.prop_f_dontmangle_by_config}`);
        console.log(`MangleStaticPropertyTest.static_getter_should_mangle: ${MangleStaticPropertyTest.static_get_set_should_mangle}`);
        console.log(`MangleStaticPropertyTest.static_getter_should_mangle2: ${MangleStaticPropertyTest.static_get_set_should_mangle2}`);

        MangleStaticPropertyTest.static_get_set_dont_mangle_by_config = 111;
        console.log(MangleStaticPropertyTest.static_get_set_dont_mangle_by_config);
    }
}

console.log(`-------- after init --------`);
MangleStaticPropertyTest.helloTestMangleStaticProp();
MangleStaticPropertyTest.dontMangleMe3();
MangleStaticPropertyTest.mangleMe();
MangleStaticPropertyTest.mangleMeByConfig();
MangleStaticPropertyTest.prop_a_dontmangle = 2;
MangleStaticPropertyTest.prop_d_mangle = 12;
MangleStaticPropertyTest.prop_e_mangle_by_config = 4;
MangleStaticPropertyTest.static_get_set_should_mangle_by_config = 123;
console.log(MangleStaticPropertyTest.static_get_set_should_mangle_by_config);


/** @mangle */
interface IMangleQuestionTestAAA {
    bbb?: number;
}

/** @mangle */
interface IMangleQuestionTestProp2 {
    aaa?: IMangleQuestionTestAAA;
}

/** @mangle */
interface IMangleQuestionTest {
    mangleMeQuestionProp: number;
    prop2?: IMangleQuestionTestProp2;
}

class MangleQuestionProperties {
    private _myProp: IMangleQuestionTest | undefined;

    test(): void {
        if (this._myProp?.mangleMeQuestionProp) {
            this._myProp.mangleMeQuestionProp = 123;
        }
        const a = this._myProp?.mangleMeQuestionProp;
        console.log(a);

        // FIXME: Doesn't support ElementAccessExpression with QuestionToken before.
        console.log(this._myProp?.['mangleMeQuestionProp']);

        if (this._myProp) {
            console.log(this._myProp['mangleMeQuestionProp']);
        }
    }

    getProp (): number | undefined {
        return this._myProp?.mangleMeQuestionProp;
    }

    getProp2 (): number | undefined {
        // FIXME: Doesn't support ElementAccessExpression with QuestionToken before.
        return this._myProp?.['mangleMeQuestionProp'];
    }

    getProp3 (): number | undefined {
        return this._myProp?.prop2?.aaa?.bbb;
    }
}

const mangleQuestionProperties = new MangleQuestionProperties();
mangleQuestionProperties.test();

/** @mangle */
export class MangleTestMangleWholeClassIncludingStatic {
    // public _myProp1: number = 123;
    // public getMyProp1(): number { return this._myProp1; }
    public static _timers = [];
    public static getTimers(): any[] { return MangleTestMangleWholeClassIncludingStatic._timers; }
}