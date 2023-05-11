function test1 (struct?: Object) {
    const a = {struct};
    console.warn(a.struct);
}


function test2 (a: number, struct: Object) {
    const b = {struct};
    const c = {struct: struct,}
    const d = {struct: 1,}
    const e = {struct: () => {},}
    console.warn(b.struct);
}

function test3 () {
    const struct = {
        test (){},
        test2: 1,
    };
    struct.test();
    console.error(struct.test2);
}

function test4 (test: {struct: number}) {
    const { struct } = test;
    const test2 = {
        struct,
    };
}

interface ITest {
    struct: number;
}

function test5 ({ struct }: ITest) {
    const test = {
        struct,
    };
}

class Mesh {
    get struct () {return 1}
    set struct (v) {}
}

class Mesh2 {
    public struct: number = 1;
}


class Mesh3 {
    public struct () {}
}
class Mesh4 {
    private static struct = 1;
}
class Mesh5 {
    private test (struct: number){}
}

function test6 (mesh2?: Mesh2, mesh3?: Mesh3) {
    mesh2!.struct;
    mesh3?.struct();
}