
export interface IMangleGrand {
    helloGrandDontMangle1(): void;
    /** @mangle */
    helloGrandMangleMe3(): void;

    /** @mangle */
    iGrandPublicPropMangleMe: number;

    get grandPropDontMangle(): number;
    set grandPropDontMangle(value: number);

    /** @mangle */
    get iGrandPropMangle(): number;
    set iGrandPropMangle(value: number);

    /** @mangle */
    iGrandPublicPropMangleJsDocButInDontMangleList: number;
}

/** @mangle */
export interface IWebGLBindingMapping {
    blockOffsets: number[];
    samplerTextureOffsets: number[];
    flexibleSet: number;
}

export class MangleWholeClassBase {
    protected mangleWholeClassBaseProtectedProp1 = 123;
    protected helloMangleWholeClassBaseProtectedMethod1(): void {}
    public helloMangleWholeClassBasePublicMethod1(): void {}
}

export interface IMangleWholeClassInterface {
    iMangleWholeClassInterfaceProp1: number;
    iMangleWholeClassInterfaceProp2: string;
    helloMangleWholeClassInterfaceMethod1(): void;
}


export class MangleWholeClass extends MangleWholeClassBase implements IMangleWholeClassInterface {
    mangleWholeClassPublicProp1 = 123;
    protected mangleWholeClassProtectedProp2 = 123;
    private mangleWholeClassPrivateProp3 = 123;

    constructor() {
        super();
        this.helloMangleWholeClassPublicMethod1();
        this.helloMangleWholeClassProtectedMethod2();
        this.helloMangleWholeClassPrivateMethod3();
        this.helloMangleWholeClassBaseProtectedMethod1();
    }
    iMangleWholeClassInterfaceProp1: number = 1;
    iMangleWholeClassInterfaceProp2: string = 'hello';
    helloMangleWholeClassInterfaceMethod1(): void {
        
    }

    getMangleWholeClassPrivateProp3(): number {
        return this.mangleWholeClassPrivateProp3;
    }
    
    helloMangleWholeClassPublicMethod1(): void {}
    protected helloMangleWholeClassProtectedMethod2(): void {}
    private helloMangleWholeClassPrivateMethod3(): void {}
}

export class MyClassExtendsMangleWholeClass extends MangleWholeClass {

    private subclassExtendsMangleWholeProp1 = 123;
    protected subclassExtendsMangleWholeProp2 = 123;
    public subclassExtendsMangleWholeProp3 = 123;

    constructor() {
        super();
        this.helloMangleWholeClassPublicMethod1();
        this.helloMangleWholeClassProtectedMethod2();
    }

    protected helloMangleWholeClassProtectedMethod2(): void {
        this.subclassExtendsMangleWholeProp1 = 123;
        this.subclassExtendsMangleWholeProp2 = 123;
        this.subclassExtendsMangleWholeProp3 = 123;
    }

    getSubclassExtendsMangleWholeProp1(): number {
        return this.subclassExtendsMangleWholeProp1;
    }

    helloSubclassExtendsMangleWholeMethod1(): void {}
}

export abstract class ManglePropertyGrand implements IMangleGrand {
    get iGrandPropMangle(): number {
        return this._grandPropMangle2;
    }
    set iGrandPropMangle(value: number) {
        this._grandPropMangle2 = value;
    }
    
    private _grandPropMangle2: number = 0;
    private _grandPropMangle1: number = 0;
    protected _grandProtectedPropDontMangle: number = 1;
    
    /** @mangle */
    protected _grandProtectedPropMangle: number = 1;
    /** @mangle */
    public grandPublicPropMangle: number = 2;

    iGrandPublicPropMangleMe: number = 3;
    iGrandPublicPropMangleJsDocButInDontMangleList: number = 0;

    public helloGrandMangleInMangleList(): void {

    }

    helloGrandDontMangle1(): void {
        this._grandPrivateMethod();
    }

    public helloGrandDontMangleMe(): void {
    }

    /** @mangle */
    public abstract helloGrandMangleMePublic(): void;

    /** @mangle */
    protected helloGrandMangleMeProtected(): void {}

    protected abstract helloGrandAbstractDontMangle(): void;

    /** @mangle */
    protected abstract helloGrandAbstractMangleMe(): void;

    helloGrandMangleMe3(): void {
        this.mangleTagInBaseButDontmangleTagInSub();
    }

    private _grandPrivateMethod(): void {
        this._grandPropMangle1 = 123;
    }

    /** @mangle */
    get grandPropDontMangle(): number {
        return this._grandPropMangle1;
    }

    /** @mangle */
    set grandPropDontMangle(value: number) {
        this._grandPropMangle1 = value;
    }

    /** @mangle */
    mangleTagInBaseButDontmangleTagInSub(): void {}
}

export class ManglePropertyBase extends ManglePropertyGrand implements ManglePropertyBase {
    protected helloGrandAbstractDontMangle(): void {
        this._grandProtectedPropDontMangle = 444;
        this._grandProtectedPropMangle = 555;
    }
    protected helloGrandAbstractMangleMe(): void {
    }

    /** @mangle */
    helloGrandDontMangle1(): void {

    }

    helloGrandMangleMePublic(): void {
    }

    protected helloGrandMangleMeProtected(): void {
        
    }

    helloGrandMangleMe3(): void {
        super.helloGrandMangleMe3();
    }

    private _baseProp: number = 0;
    /** @dontmangle */
    private _basePrivateHasDontMangleProp: number = 0;
    protected _baseProtectedProp: number = 1;
    /** @mangle */
    public _basePublicProp1Mangle: number = 2;
    _basePublicProp2DontMangle: number = 3;

    /** @mangle */
    public declare declarePropMangle: string;
    public declare declarePropDontMangle: number;

    constructor() {
        super();
        this._basePrivateMethod();
        this.declarePropMangle = 'world';
        this.declarePropDontMangle = 123;
    }

    private _basePrivateMethod(): void {
        this._baseProp = 123;
        this._basePrivateHasDontMangleProp = 123;

        const { _baseProp: baseProp, _basePrivateHasDontMangleProp: basePrivateHasDontMangleProp } = this;
        console.log(baseProp, basePrivateHasDontMangleProp);

        this._dontMangleMeProp = 444;
        this.dontMangleMe();
        console.log(this.privateGetterMangle);
        this.mangleTagInBaseButDontmangleTagInSub();
    }

    get dontMangleMePropGetter(): number {
        return this._dontMangleMeProp;
    }

    private get privateGetterMangle(): number {
        return this._mangleMeProp;
    }

    /** @mangle */
    basePublicMethod(): void {}

    _mangleMeProp = 123;
    public _mangleMeProp2 = 'hello';

    private _dontMangleMeProp = 1233;
    protected dontMangleMeProp2 = 'hello3';
    /** @mangle */
    dontMangleMeProp3 = 1234;

    mangleMe(): void {}
    public mangleMe2(): void {}
    private dontMangleMe(): void {}
    protected dontMangleMe2(): void {}
    /** @mangle */
    public dontMangleMe3(): void {}

    /** @dontmangle */
    mangleTagInBaseButDontmangleTagInSub(): void {}
}

export enum MangleTestMyBaseEnum {
    HELLO = 123444,
    WORLD,
    FOO = 123,
    BAR,
    TS,
    BABEL
}

export interface IMangleTest {
    /** @mangle */
    helloInterface1 (): void;
    helloInterface2 (v: string): number;
    /** @mangle */
    helloInterface3? (v: string): number;
    /** @mangle */
    interfaceProp1: number;
    interfaceProp2: string;
    /** @mangle */
    interfaceProp3?: boolean;
}

export interface IWebGLGPUTexture {
    /** @mangle */
    width: number;
    height: number;
    depth: number;
    /** @mangle */
    size: number;
    arrayLayer: number;
    mipLevel: number;
    /** @mangle */
    isPowerOf2: boolean;

    glTarget: GLenum;
    glInternalFmt: GLenum;
    glFormat: GLenum;
    glType: GLenum;
    glUsage: GLenum;
    glTexture: WebGLTexture | null;
    glRenderbuffer: WebGLRenderbuffer | null;
    glWrapS: GLenum;
    glWrapT: GLenum;
    glMinFilter: GLenum;
    glMagFilter: GLenum;
    isSwapchainTexture: boolean;

    get widthGetter(): number;
    set widthSetter(value: number);

    /** @mangle */
    helloMangle(): void;

    helloDontMangle(): void;
}

/** @mangle */
export interface IWebGLGPUTexture2 {
    width: number;
    height: number;
    depth: number;
    size: number;
    arrayLayer: number;
    mipLevel: number;
    isPowerOf2: boolean;

    glTarget: GLenum;
    glInternalFmt: GLenum;
    glFormat: GLenum;
    glType: GLenum;
    glUsage: GLenum;
    glTexture: WebGLTexture | null;
    glRenderbuffer: WebGLRenderbuffer | null;
    glWrapS: GLenum;
    glWrapT: GLenum;
    glMinFilter: GLenum;
    glMagFilter: GLenum;
    isSwapchainTexture: boolean;

    /** @mangle */
    get widthGetter(): number;
    set widthSetter(value: number);
}

export interface IWebGLGPUTexture3 {
    /** @mangle */
    width: number;
    height: number;
    depth: number;
    /** @mangle */
    size: number;
    arrayLayer: number;
    mipLevel: number;
    /** @mangle */
    isPowerOf2: boolean;

    glTarget: GLenum;
    glInternalFmt: GLenum;
    glFormat: GLenum;
    glType: GLenum;
    glUsage: GLenum;
    glTexture: WebGLTexture | null;
    glRenderbuffer: WebGLRenderbuffer | null;
    glWrapS: GLenum;
    glWrapT: GLenum;
    glMinFilter: GLenum;
    glMagFilter: GLenum;
    isSwapchainTexture: boolean;
}

export interface IWebGLGPUTexture4 {
    width: number;
    height: number;
    depth: number;
    size: number;
    arrayLayer: number;
    mipLevel: number;
    isPowerOf2: boolean;

    glTarget: GLenum;
    glInternalFmt: GLenum;
    glFormat: GLenum;
    glType: GLenum;
    glUsage: GLenum;
    glTexture: WebGLTexture | null;
    glRenderbuffer: WebGLRenderbuffer | null;
    glWrapS: GLenum;
    glWrapT: GLenum;
    glMinFilter: GLenum;
    glMagFilter: GLenum;
    isSwapchainTexture: boolean;

    get widthGetter(): number;
}

export interface IWebGLBindingMapping {
    blockOffsets: number[];
    samplerTextureOffsets: number[];
    flexibleSet: number;
}

/** @mangle */
export interface IWebGLGPUShaderStage {
    source: string | number;
    glShader: WebGLShader | null;
}

/** @mangle */
export interface IWebGLGPUShader {
    name: string | number;
    gpuStages: IWebGLGPUShaderStage[];
    gpuStageMap: Record<string, IWebGLGPUShaderStage>;
}
