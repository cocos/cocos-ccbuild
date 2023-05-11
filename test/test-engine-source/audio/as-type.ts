const a = 1;
const b = 2;
// this is a bug in babel
const c = ((a as unknown as number) & b) as unknown as number;
const d = (a & b) as unknown as number;