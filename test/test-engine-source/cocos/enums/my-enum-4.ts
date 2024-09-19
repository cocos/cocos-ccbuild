import { MyEnum } from './my-enum';

export enum MyEnum4 {
    AAABBB,
    Haha = MyEnum.AAA,
    Hi = MyEnum.CCC,
}

console.log(MyEnum4.AAABBB, MyEnum4.Haha, MyEnum4.Hi);
