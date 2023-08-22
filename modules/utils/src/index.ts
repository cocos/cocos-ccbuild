import * as ps from './path';

export { ps };

// TODO: for module compatibility, to be removed.
export {
    formatPath,
    absolutePathFuncFactory,
    replaceExtname,
    rebasePath,
    filePathToModuleRequest,
    toExtensionLess,
    readdirR,
} from './path';

export function asserts(expr: boolean, message?: string): boolean {
    if (!expr) {
        throw new Error(message);
    }
    return true;
}

export function isThenable (value: any): boolean {
    // https://stackoverflow.com/a/53955664/10602525
    return Boolean(value && typeof value.then === 'function');
}