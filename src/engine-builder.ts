import * as fs from 'fs-extra';
import * as ps from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { IFlagConfig, PlatformType } from "./config-parser";

export interface IBuildOptions {
    root: string;
    entries: string[];
    platform: PlatformType;
    flagConfig: Partial<IFlagConfig>;
    resolveExtensions?: string[];
    outDir?: string;
}

export interface IBuildResult {
    [fileName: string]: {
        code: string;
        map?: string;
    }
}

export interface ICompileResult {
    code: string;
    map?: string;
    deps: string[];
}

export class EngineBuilder {
    private _resolveExtensions = ['.ts'];

    constructor () {

    }

    build (options: IBuildOptions): Promise<IBuildResult> {
        return new Promise(resolve => {
            let { root, resolveExtensions, outDir } = options;
            this._resolveExtensions = resolveExtensions ?? this._resolveExtensions;
            const result: IBuildResult = {};
            const compileRecursively = (file: string) => {
                const compileResult = this._compileFile(file);
                result[file] = {
                    code: compileResult.code,
                };
                compileResult.deps.forEach(dep => {
                    compileRecursively(dep);
                });
            };
            options.entries.forEach(file => {
                compileRecursively(file);
            });

            if (outDir) {
                for (const file in result) {
                    const { code } = result[file];
                    const targetFile = ps.join(outDir, ps.relative(root, file)).replace(/\\/g, '/');
                    fs.outputFileSync(targetFile, code, 'utf8');
                }
            }
            
            resolve(result);
        });
    }

    _compileFile (file: string): ICompileResult {
        const code = fs.readFileSync(file, 'utf-8');
        const ast = parser.parse(code, {
            sourceType: 'module'
        });
        let deps: string[] = [];
        traverse(ast, {
            Import (path) {
                // @ts-ignore
                deps.push(path.node.source.value)
            },
            ExportDeclaration (path) {
                // @ts-ignore
                const source = path.node.source
                if (source) {
                    deps.push(source.value)
                }
            },
        });
        deps = deps.map(dep => ps.join(ps.dirname(file), dep).replace(/\\/g, '/'));
        const resolvedDeps: string[] = [];
        deps.forEach(dep => {
            for (let ext of this._resolveExtensions) {
                const fileExt = dep + ext;
                const indexExt = ps.join(dep, 'index').replace(/\\/g, '/') + ext; 
                if (fs.existsSync(fileExt)) {
                    resolvedDeps.push(fileExt);
                } else if (fs.existsSync(indexExt)) {
                    resolvedDeps.push(indexExt);
                }
            }
        });

        // TODO: compile code
        return {
            code,
            deps: resolvedDeps,
        };
    }
}