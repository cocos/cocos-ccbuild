import * as fs from 'fs-extra';
import * as ps from 'path';

export async function readdirR (item: string, reduceOutput: string[]) { 
    if ((await fs.stat(item)).isDirectory()) {
        const dirItems = await fs.readdir(item);
        for (let subItem of dirItems) {
            await readdirR(ps.join(item, subItem), reduceOutput);
        }
    } else {
        reduceOutput.push(item);
    }
}
