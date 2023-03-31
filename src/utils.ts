export function asserts(expr: unknown, message?: string): boolean {
    if (!expr) {
        throw new Error(message);
    }
    return true;
}

export function filePathToModuleRequest (path: string) {
    return path.replace(/\\/g, '\\\\');
}