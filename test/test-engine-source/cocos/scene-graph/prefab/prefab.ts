import { SUPPORT_JIT } from 'internal:constants';
import { compile } from '../../serialization/instantiate-jit';

export class Prefab {
    private _instantiate(): void {
        if (SUPPORT_JIT) {
            compile();
        } else {
            console.error(`Dosn't support JIT`);
        }
    }
}