import * as fs from 'fs-extra';
import * as ps from 'path';
import * as babel from '@babel/core';
import * as parser from '@babel/parser';
// @ts-ignore
import pluginSyntaxTS from '@babel/plugin-syntax-typescript';
// @ts-ignore
import syntaxDecorators from '@babel/plugin-syntax-decorators';
import traverse from '@babel/traverse';
import { IFlagConfig, ModeType, PlatformType } from "./stats-query";

export interface IBuildOptions {
    root: string;
    platform: PlatformType;
    mode: ModeType;
    flagConfig: Partial<IFlagConfig>;
}

interface IParsedBuildOptions {
    root: string;
    entries: string[];
    platform: PlatformType;
    flagConfig: Partial<IFlagConfig>;
    resolveExtensions?: string[];
    outDir?: string;
    virtualModule?: Record<string, string>,
}

interface ITransformResult {
    code: string;
    map?: any;
}

interface IDependencyGraph {
    [file: string]: string[];
}

export interface IBuildResult {
    [fileName: string]: ITransformResult;
}

export class EngineBuilder {
    private _options!: IParsedBuildOptions;
    private _virtual2dir: Record<string, string> = {};

    // public async build (options: IBuildOptions): Promise<IBuildResult> {
    public async build (options: IParsedBuildOptions): Promise<IBuildResult> {
        this._options = options;
        const { root, virtualModule } = options;
        if (virtualModule) {
            for (let virtualName in virtualModule) {
                this._virtual2dir[virtualName] = ps.join(root, '__virtual__', virtualName.replace(/:/g, '_')).replace(/\\/g, '/') + '.ts';
            }
        }
        this._options.resolveExtensions = options.resolveExtensions ?? ['.ts'];
        const buildResult: IBuildResult = {};
        // const parsedOptions = this._parseOptions(options);
        const parsedOptions = options;
        const allScripts = this._resolveEntries(parsedOptions.entries);
        for (let file of allScripts) {
            if (virtualModule && file in virtualModule) {
                buildResult[this._virtual2dir[file]] = {
                    code: virtualModule[file],  // TODO: transform virtual module code
                };
            } else {
                buildResult[file] = this._transformFile(file);
            }
        }
        if (parsedOptions.outDir) {
            console.log(buildResult)
        }
        return buildResult;
        // return this._doBuild(parsedOptions);
    }

    // private _parseOptions (options: IBuildOptions): IParsedBuildOptions {

    // }

    // NOTE: do we need to return the dependency graph ?
    private _resolveEntries (entries: string[]): string[] {
        const depGraph: IDependencyGraph = {};
        for (let entry of entries) {
            this._resolveDeps(entry, depGraph);
        }
        return Object.keys(depGraph);
    }

    private _resolveDeps (file: string, depGraph: IDependencyGraph) {
        if (depGraph[file]) {
            // skip resolve cache.
            return;
        }
        const { virtualModule, resolveExtensions } = this._options;
        if (virtualModule && file in virtualModule) {
            // don't resolve virtual module
            depGraph[file] = [];  
            return; 
        }
        const code = fs.readFileSync(file, 'utf8');
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: [
                'typescript',
                'decorators-legacy',
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
        depGraph[file] = resolvedDeps;
        resolvedDeps.forEach(dep => {
            this._resolveDeps(dep, depGraph);
        });
    }

    private _transformFile (file: string): ITransformResult {
        const { virtualModule, root } = this._options;
        const code = fs.readFileSync(file, 'utf-8');
        const transformedResult = babel.transformSync(code, {
            plugins: [
                [pluginSyntaxTS],
                [syntaxDecorators, {
                    version: '2018-09',  // NOTE: only version 2018-09 of decorator proposal can support decorators before export, which we need for tsc compiler
                    decoratorsBeforeExport: true,
                }],
                [
                    function () {
                        return {
                            visitor: {
                                ImportDeclaration (path: babel.NodePath<babel.types.ImportDeclaration>) {
                                    const specifier = path.node.source.value as string;
                                    if (virtualModule && specifier in virtualModule) {
                                        traverse(path.node, {
                                            StringLiteral (path: babel.NodePath<babel.types.StringLiteral>) {
                                                const virtualPath = ps.join(root, '__virtual__', specifier).replace(/\\/g, '/');
                                                const relativePath = ps.relative(ps.dirname(file), virtualPath).replace(/\\/g, '/');
                                                path.replaceWith(babel.types.stringLiteral(relativePath));
                                                path.skip();
                                            }
                                        }, path.scope);
                                    }
                                },
                                ExportDeclaration (path: babel.NodePath<babel.types.ExportDeclaration>) {
                                    // @ts-ignore
                                    const source = path.node.source;
                                    if (source) {
                                        const specifier = source.value as string;
                                        if (virtualModule && specifier in virtualModule) {
                                            traverse(path.node, {
                                                StringLiteral (path: babel.NodePath<babel.types.StringLiteral>) {
                                                    const virtualPath = ps.join(root, '__virtual__', specifier).replace(/\\/g, '/');
                                                    const relativePath = ps.relative(ps.dirname(file), virtualPath).replace(/\\/g, '/');
                                                    path.replaceWith(babel.types.stringLiteral(relativePath));
                                                    path.skip();
                                                }
                                            }, path.scope);
                                        }
                                    }
                                },
                            }
                        }
                    }
                ]
            ],
        });
        return {
            code: transformedResult?.code!,
        };
    }
}