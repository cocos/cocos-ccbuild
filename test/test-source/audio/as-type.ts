const a = 1;
const b = 2;
const c = ((a as unknown as number) & b) as unknown as number; // this is a bug in babel