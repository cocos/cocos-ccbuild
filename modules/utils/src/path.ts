import * as ps from 'path';
import * as fs from 'fs-extra';

export function formatPath (path: string): string {
    return path.replace(/\\/g, '/');
}

export function absolutePathFuncFactory (dirname: string): (relativePath: string) => string {
    return function absolutePath (relativePath: string) {
        return ps.join(dirname, relativePath);
    };
}

export function replaceExtname (path: string, extname: string): string {
    return path.slice(0, -ps.extname(path).length) + extname;
}

export function rebasePath (path: string, originDir: string, rebaseDir: string): string {
    return ps.join(rebaseDir, ps.relative(originDir, path));
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
            await readdirR(ps.join(item, subItem), reduceOutput);
        }
    } else {
        reduceOutput.push(item);
    }
}
