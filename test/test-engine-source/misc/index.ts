import './decorator';
import { Rect } from './rect'
import { Path } from './path'

let p: Path = new Path();
const r: Rect = Rect.from(0, 0, 100, 100);

interface Test {
    r: Rect;
    p: Path;
    test (r: Rect, p: Path): Rect;
}

console.log(p, r);

export * from './rect'
export * from './path'
