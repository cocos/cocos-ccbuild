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
