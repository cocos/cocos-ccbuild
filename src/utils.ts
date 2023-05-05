export function asserts(expr: unknown, message?: string): boolean {
    if (!expr) {
        throw new Error(message);
    }
    return true;
}

export function filePathToModuleRequest (path: string) {
    return path.replace(/\\/g, '\\\\');
}

export function isThenable (value: any) {
    // https://stackoverflow.com/a/53955664/10602525
    return Boolean(value && typeof value.then === 'function');
}
