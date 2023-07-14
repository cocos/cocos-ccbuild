import { formatPath } from '@ccbuild/utils';
import * as fs from 'fs-extra';
import * as ps from 'path';

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


export async function getOutputDirStructure (outDir: string): Promise<string[]> {
    const outputScripts: string[] = [];
    await readdirR(outDir, outputScripts);
    return outputScripts.map(item => formatPath(ps.relative(outDir, item)));
}

export async function getOutputContent (outFile: string): Promise<string> {
    const content = await fs.readFile(outFile, 'utf8');
    return content;
}

/**
 * We rename the `node_modules_keep` dir into `node_modules` before we running test case which relies on node resolve.
 * @param sourceRoot the root path of `node_modules_keep`
 */
export async function renameNodeModules (sourceRoot: string, afterRename: () => Promise<void>): Promise<void> {
    const fromName = ps.join(sourceRoot, 'node_modules_gitkeep');
    const toName = ps.join(sourceRoot, 'node_modules');
    try {
        await fs.copy(fromName, toName, { recursive: true });
        await afterRename();
    } catch (e) {
        console.error(e);
    } finally {
        await fs.remove(toName);
    }
}