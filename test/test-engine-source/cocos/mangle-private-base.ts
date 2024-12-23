

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
    }

    /** @mangle */
    basePublicMethod(): void {}
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