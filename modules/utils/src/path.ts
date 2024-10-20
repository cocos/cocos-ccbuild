import * as ps from 'path';
import * as fs from 'fs-extra';

export const isAbsolute: (path: string) => boolean = ps.isAbsolute;

export function resolve (...args: string[]): string {
    return formatPath(ps.resolve(...args));
}

export function dirname (path: string): string {
    return formatPath(ps.dirname(path));
}

export function basename (path: string): string {
    return formatPath(ps.basename(path));
}

export function join (...args: string[]): string {
    return formatPath(ps.join(...args));
}

export function relative (from: string, to: string): string {
    return formatPath(ps.relative(from, to));
}

export function formatPath (path: string): string {
    return path.replace(/\\/g, '/');
}

export function absolutePathFuncFactory (dirname: string): (relativePath: string) => string {
    return function absolutePath (relativePath: string) {
        return join(dirname, relativePath);
    };
}

export function replaceExtname (path: string, originalExtname: string, newExtName: string): string {
    return path.slice(0, -originalExtname.length) + newExtName;
}

export function rebasePath (path: string, originDir: string, rebaseDir: string): string {
    return join(rebaseDir, ps.relative(originDir, path));
}

export function filePathToModuleRequest (path: string): string {
    return path.replace(/\\/g, '\\\\');
}

export function toExtensionLess (path: string): string {
    return path.slice(0, -ps.extname(path).length);
}

export async function readdirR (item: string, reduceOutput: string[]): Promise<void> { 
    if ((await fs.stat(item)).isDirectory()) {
        const dirItems = await fs.readdir(item);
        for (const subItem of dirItems) {
            await readdirR(join(item, subItem), reduceOutput);
        }
    } else {
        reduceOutput.push(item);
    }
}

export function makePathEqualityKey(path: string): string {
    return process.platform === 'win32' ? path.toLocaleLowerCase() : path;
}
