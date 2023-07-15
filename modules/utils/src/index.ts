export * from './path';

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