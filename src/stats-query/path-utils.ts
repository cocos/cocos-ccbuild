import * as ps from 'path';

export function normalizePath (path: string): string {
    return path.replace(/\\/g, '/');
}

export function toExtensionLess (path: string) {
    return path.slice(0, -ps.extname(path).length);
}