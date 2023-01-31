import fs from 'fs-extra';
import ps from 'path';

export interface IResolveResult {
    id: string,
    deps: string[],
}

const importRegExp = /[(import)(export)].*?['"](.*?)['"]/g;

export class ModuleResolver {

    resolve (filepath: string): IResolveResult {
        const code = fs.readFileSync(filepath, 'utf8');
        const all = code.matchAll(importRegExp);
        const deps = [];
        for (let item of all ) {
            let dep = item[1];
            if (!ps.isAbsolute(dep)) {
                dep = ps.join(ps.dirname(filepath), dep);
            }
            deps.push(dep + '.ts');
        }
        return {
            id: filepath,
            deps,
        };
    }
}