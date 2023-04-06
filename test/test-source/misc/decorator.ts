const classDec: ClassDecorator = function (target) {}
const propDec1: PropertyDecorator = function (target, propertyKey) {}
const propDec2: PropertyDecorator = function (target, propertyKey) {}
function propDecFactory (name: string, ...args: any) {
    return function (target, propertyKey) {} as PropertyDecorator;
}

@classDec
class A {
    @propDec1
    public test1 = 1;

    @propDec1
    @propDec2
    public test2 = 2;

    @propDecFactory('test')
    public test3 = 3;

    @propDec1
    @propDecFactory('test', 1, 2, () => {})
    public test4 = 4;

    @propDec1
    public test5;
}
