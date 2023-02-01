import * as fs from 'fs-extra';
import * as ps from 'path';
import * as babel from '@babel/core';
import * as parser from '@babel/parser';
// @ts-ignore
import pluginSyntaxTS from '@babel/plugin-syntax-typescript';
import traverse from '@babel/traverse';
import { IFlagConfig, PlatformType } from "./config-parser";

export interface IBuildOptions {
    root: string;
    entries: string[];
    platform: PlatformType;
    flagConfig: Partial<IFlagConfig>;
    resolveExtensions?: string[];
    outDir?: string;
    virtualModule?: Record<string, string>,
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
    private _options!: IBuildOptions;

    public build (options: IBuildOptions): Promise<IBuildResult> {
        return new Promise(resolve => {
            this._options = options;
            let { root, outDir, virtualModule } = options;
            options.resolveExtensions = options.resolveExtensions ?? ['.ts'];
            const result: IBuildResult = {};
            const compileRecursively = (file: string) => {
                if (virtualModule && file in virtualModule) {
                    const transformedCode = this._transform(file, virtualModule[file]);
                    result[ps.join(root, '__virtual__', file).replace(/\\/g, '/') + '.ts'] =  {
                        code: transformedCode,
                    };
                    return;
                }
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

    private _compileFile (file: string): ICompileResult {
        const code = fs.readFileSync(file, 'utf-8');
        const deps = this._resolveDeps(file, code);
        const transformedCode = this._transform(file, code);

        return {
            code: transformedCode,
            deps,
        };
    }

    private _resolveDeps (file: string, code: string): string[] {
        const { virtualModule, resolveExtensions } = this._options;
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: [
                'typescript'
            ],
        });
        
        let deps: string[] = [];
        traverse(ast, {
            ImportDeclaration (path) {
                deps.push(path.node.source.value);
            },
            ExportDeclaration (path) {
                // @ts-ignore
                const source = path.node.source;
                if (source) {
                    deps.push(source.value);
                }
            },
        });
        const resolvedDeps: string[] = [];
        deps.forEach(dep => {
            // ON RESOLVE
            // virtual module
            if (virtualModule && dep in virtualModule) {
                resolvedDeps.push(dep);
                return;
            }
            // fs module
            dep = ps.join(ps.dirname(file), dep).replace(/\\/g, '/');
            for (let ext of resolveExtensions!) {
                const fileExt = dep + ext;
                const indexExt = ps.join(dep, 'index').replace(/\\/g, '/') + ext; 
                if (fs.existsSync(fileExt)) {
                    resolvedDeps.push(fileExt);
                } else if (fs.existsSync(indexExt)) {
                    resolvedDeps.push(indexExt);
                }
            }
        });
        return resolvedDeps;
    }

    private _transform (file: string, code: string): string {
        const res = babel.transformSync(code, {
            plugins: [
                [pluginSyntaxTS],
                [
                    function () {
                        return {
                            visitor: {
                                ImportDeclaration (path: any) {
                                    console.log(path.node.source.value);
                                },
                                ExportDeclaration (path: any) {
                                    // @ts-ignore
                                    const source = path.node.source;
                                    if (source) {
                                        console.log(source.value);
                                    }
                                },
                            }
                        }
                    }
                ]
            ],
        });
        return res?.code!;
    }
}