

export class ManglePropertyBase {
    private _baseProp: number = 0;
    protected _baseProtectedProp: number = 1;
    /** @mangle */
    public _basePublicProp: number = 2;
    _basePublicProp2: number = 3;

    /** @mangle */
    public declare declareProp: string;

    constructor() {
        this._basePrivateMethod();
    }

    private _basePrivateMethod(): void {
        this._dontMangleMeProp = 444;
        this.dontMangleMe();
    }

    get dontMangleMeProp(): number {
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
    helloInterface (): void;
    helloInterface2 (v: string): number;
    helloInterface3? (v: string): number;
    /** @mangle */
    interfaceProp: number;
    interfaceProp2: string;
    interfaceProp3?: boolean;
}