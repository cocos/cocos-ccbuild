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