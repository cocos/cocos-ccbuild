
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
}

export class ManglePropertyBase extends ManglePropertyGrand {
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
        this._dontMangleMeProp = 444;
        this.dontMangleMe();
    }

    get dontMangleMePropGetter(): number {
        return this._dontMangleMeProp;
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