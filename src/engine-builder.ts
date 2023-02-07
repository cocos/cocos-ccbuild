import * as fs from 'fs-extra';
import * as ps from 'path';
import * as babel from '@babel/core';
import * as parser from '@babel/parser';
// @ts-ignore
import pluginSyntaxTS from '@babel/plugin-syntax-typescript';
// @ts-ignore
import syntaxDecorators from '@babel/plugin-syntax-decorators';
import traverse from '@babel/traverse';
import { BuildTimeConstants, FlagType, IFlagConfig, ModeType, PlatformType, StatsQuery } from "./stats-query";
import { normalizePath } from './stats-query/path-utils';

export interface IBuildOptions {
    root: string;
    entries: string[];
    platform: PlatformType;
    mode: ModeType;
    flagConfig: Partial<IFlagConfig>;
    outDir?: string;
    resolveExtensions?: string[];
}

interface ITransformResult {
    code: string;
    map?: any;
    deps: string[],
}

interface IDependencyGraph {
    [file: string]: string[];
}

export interface IBuildResult {
    [fileName: string]: ITransformResult;
}

export class EngineBuilder {
    private _options!: IBuildOptions;
    private _virtual2code: Record<string, string> = {};
    private _virtualOverrides: Record<string, string> = {};
    private _buildTimeConstants!: BuildTimeConstants;
    private _moduleOverrides!: Record<string, string>;

    public async build (options: IBuildOptions): Promise<IBuildResult> {
        const { root } = options;
        const buildResult: IBuildResult = {};
        
        await this._initOptions(options);

        const virtualModules = Object.values(this._virtualOverrides);
        const file2virtual = Object.entries(this._virtualOverrides).reduce((result, [k, v]) => {
            result[v] = k;
            return result;
        }, {} as Record<string, string>);
        const transformFiles = (files: string[]) => {
            for (let file of files) {
                if (fs.existsSync(file)) {
                    const code = fs.readFileSync(file, 'utf8');
                    const transformResult = this._transform(file, code);
                    buildResult[file] = {
                        code: transformResult.code,
                        deps: transformResult.deps,
                    };
                    transformFiles(transformResult.deps);
                } else if (this._moduleOverrides[file] && fs.existsSync(this._moduleOverrides[file])) {
                    const overrideFile = this._moduleOverrides[file];
                    const code = fs.readFileSync(overrideFile, 'utf8');
                    const transformResult = this._transform(file, code);
                    buildResult[file] = {
                        code: transformResult.code,
                        deps: transformResult.deps,
                    };
                    transformFiles(transformResult.deps);
                } 
                else if (virtualModules.includes(file)) {
                    const transformResult = this._transform(file, this._virtual2code[file2virtual[file]]);
                    buildResult[file] = {
                        code: transformResult.code,
                        deps: transformResult.deps,
                    };
                } else {
                    throw new Error(`Cannot transform file ${file}, which is not exist`);
                }
            }
        };
        transformFiles(options.entries);

        if (options.outDir) {
            for (let file in buildResult) {
                const res = buildResult[file];
                const output = ps.join(options.outDir, ps.relative(root, file));
                fs.outputFileSync(output, res.code, 'utf8');
            }
        }
        return buildResult;
    }

    private async _initOptions (options: IBuildOptions): Promise<void> {
        this._options = options;
        const { root, flagConfig, platform, mode } = options;
        const statsQuery = await StatsQuery.create(root);
        const constantManager = statsQuery.constantManager;
        this._buildTimeConstants = constantManager.genBuildTimeConstants({
            platform,
            mode,
            flags: flagConfig,
        });
        this._moduleOverrides = statsQuery.evaluateModuleOverrides({
            mode: options.mode,
            platform: options.platform,
            buildTimeConstants: this._buildTimeConstants,
        });
        this._moduleOverrides = Object.entries(this._moduleOverrides).reduce((result, [k, v]) => {
            result[normalizePath(k)] = normalizePath(v);
            return result;
        }, {} as Record<string, string>);

        this._virtual2code['internal:constants'] = constantManager.exportStaticConstants({
            platform,
            mode,
            flags: flagConfig,
        });
        for (let virtualName in this._virtual2code) {
            this._virtualOverrides[virtualName] = normalizePath(ps.join(root, '__virtual__', virtualName.replace(/:/g, '_'))) + '.ts';
        }
        this._options.resolveExtensions = options.resolveExtensions ?? ['.ts'];

    }

    private _transform (file: string, code: string): ITransformResult {
        const resolvedDeps: string[] = [];
        type ImportTypes = babel.NodePath<babel.types.ImportDeclaration> | babel.NodePath<babel.types.ExportDeclaration>;
        const transformImportSpecifier = (path: ImportTypes, targetSpecifier: string) => {
            traverse(path.node, {
                StringLiteral (path: babel.NodePath<babel.types.StringLiteral>) {
                    path.replaceWith(babel.types.stringLiteral(targetSpecifier));
                    path.skip();
                }
            }, path.scope);
        };
        const importExportVisitor = (path: ImportTypes) => {
            // @ts-ignore
            const source = path.node.source;
            if (source) {
                const specifier = source.value as string;
                const targetSpecifier = this._resolve(specifier, file);
                if (!targetSpecifier) {
                    throw new Error(`Cannot resolve '${specifier}' from file: ${file}`);
                }
                if (specifier in this._virtual2code || specifier in this._moduleOverrides) {
                    transformImportSpecifier(path, normalizePath(ps.relative(ps.dirname(file), targetSpecifier)));
                } else {
                    const originalFile = this._resolveRelative(specifier, file);

                    if (originalFile && originalFile in this._moduleOverrides) {
                        let relativePath = normalizePath(ps.relative(ps.dirname(file), targetSpecifier)).slice(0, -3);
                        if (!relativePath.startsWith('.')) {
                            relativePath = './' + relativePath;
                        }
                        transformImportSpecifier(path, relativePath);
                    }
                }
                resolvedDeps.push(targetSpecifier);
            }
        }
        const transformResult = babel.transformSync(code, {
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
                                ImportDeclaration: importExportVisitor,
                                ExportDeclaration: importExportVisitor,
                            }
                        }
                    }
                ]
            ],
        });
        return {
            code: transformResult?.code!,
            deps: resolvedDeps,
        };
    }

    private _resolve (specifier: string, importer?: string): string | undefined {
        const { root } = this._options;
        if (!importer) {
            return specifier;
        } else if (specifier in this._virtual2code) {
            return this._virtualOverrides[specifier];
        } else if (specifier in this._moduleOverrides) {
            return this._moduleOverrides[specifier];
        } else if (!ps.isAbsolute(specifier)) {
            const resolved = this._resolveRelative(specifier, importer);
            if (resolved) {
                return this._moduleOverrides[resolved] ?? resolved;
            }
        } 
    }

    private _resolveRelative (specifier: string, importer: string): string | undefined {
        const file = normalizePath(ps.join(ps.dirname(importer), specifier));
        const fileExt = file + '.ts';
        const indexExt = normalizePath(ps.join(file, 'index')) + '.ts';
        if (fs.existsSync(fileExt)) {
            return fileExt;
        } else if (fs.existsSync(indexExt)) {
            return indexExt;
        }
    }
}