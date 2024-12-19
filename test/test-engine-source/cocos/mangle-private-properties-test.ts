
// const mangle: PropertyDecorator = function (target, propertyKey) {};

import { ManglePropertyBase } from './mangle-private-base';

export class ManglePrivatePropertiesTest extends ManglePropertyBase {
    // @mangle
    private instanceProperty: string = '';
  
    // @mangle
    private static staticProperty: string = '';
  
    // @mangle
    private instanceMethod(): void {}
  
    // @mangle
    private static staticMethod(): void {}

    private myProp0: number = 123;
    private myProp1: number = 456;

    // private myProp2: number;

    private myProp3;
    private declare myProp4: number;

    constructor() {
        super();
        this.myProp4 = 789;
    }

    public getFoo(): string {
        this.instanceMethod();
        ManglePrivatePropertiesTest.staticMethod();
        ManglePrivatePropertiesTest.staticProperty = 'bar';
        this._baseProtectedProp = 323;
        this._basePublicProp = 324;
        this._basePublicProp2 = 325;
        return this.instanceProperty;
    }

}


export const myTest = 1234;
