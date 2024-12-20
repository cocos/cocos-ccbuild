

export class ManglePropertyBase {
    private _baseProp: number = 0;
    protected _baseProtectedProp: number = 1;
    public _basePublicProp: number = 2;
    _basePublicProp2: number = 3;

    constructor() {
        this._basePrivateMethod();
    }

    private _basePrivateMethod(): void {
    }
}

export enum MangleTestMyBaseEnum {
    HELLO = 123444,
    WORLD,
    FOO = 123,
    BAR,
    TS,
    BABEL
}