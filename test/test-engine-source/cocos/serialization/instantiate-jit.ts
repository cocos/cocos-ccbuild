import * as js from '../core/utils/pool';

console.log(`I'm instantiate-jit.ts`);

/*@__PURE__*/ console.log('side-effect');

class Impure {
    constructor() {
        console.log('side-effect');
    }
}

/*@__PURE__ There may be additional text in the comment */ new Impure();

const VAR = 'var ';

class Declaration {
    public declare varName: any;
    public declare expression: any;

    constructor (varName, expression) {
        this.varName = varName;
        this.expression = expression;
    }

    public toString (): string {
        return `${VAR + this.varName}=${this.expression};`;
    }
}

function mergeDeclaration (statement, expression): any {
    if (expression instanceof Declaration) {
        return new Declaration(expression.varName, statement + expression.expression);
    } else {
        return statement + expression;
    }
}

class Assignments {
    public static pool: js.Pool<{}>;

    private declare _exps: any[];
    private declare _targetExp: any;

    constructor (targetExpression?) {
        this._exps = [];
        this._targetExp = targetExpression;
    }
    public append (key, expression): void {
        this._exps.push([key, expression]);
    }
    public writeCode (codeArray): void {
        console.info(`writeCode`);
    }
}

Assignments.pool = new js.Pool((obj: any) => {
    obj._exps.length = 0;
    obj._targetExp = null;
}, 1);
// HACK: here we've changed the signature of get method
(Assignments.pool.get as any) = function (this: any, targetExpression): Assignments {
    const cache: any = this._get() || new Assignments();
    cache._targetExp = targetExpression;
    return cache as Assignments;
};


export function compile(): void {
    console.log(`>>> jit compile ...`);
}