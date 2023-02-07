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
    features?: string[],
    platform: PlatformType;
    mode: ModeType;
    flagConfig: Partial<IFlagConfig>;
    outDir?: string;
}

interface IHandleResult {
    code: string;
    file: string;
    originalId: string;
    resolvedId: string;
    map: any;
    overrideId?: string;
}

interface ITransformResult {
    code: string;
    map?: any;
}

export interface IBuildResult {
    [outputFile: string]: ITransformResult;
}

export class EngineBuilder {
    private _options!: IBuildOptions;
    private _entries: string[] = [];
    private _virtual2code: Record<string, string> = {};
    private _virtualOverrides: Record<string, string> = {};
    private _buildTimeConstants!: BuildTimeConstants;
    private _moduleOverrides!: Record<string, string>;
    private _resolveExtension: string[] = ['.ts', '.json'];  // not an option
    private _buildResult: IBuildResult = {};

    public async build (options: IBuildOptions): Promise<IBuildResult> {
        const { root } = options;
        this._buildResult = {};
        await this._initOptions(options);

        const handleIdList = (idList: string[]) => {
            for (let id of idList) {
                if (this._buildResult[id]) {
                    // skip cached id
                    continue;
                }

                const handleResult = this._handleId(id);
                this._buildResult[handleResult.file] = {
                    code: handleResult.code,
                };
            }
        };
        handleIdList(this._entries);

        if (options.outDir) {
            for (let file in this._buildResult) {
                const res = this._buildResult[file];
                const output = ps.join(options.outDir, ps.relative(root, file));
                fs.outputFileSync(output, res.code, 'utf8');
            }
        }
        return this._buildResult;
    }

    private async _initOptions (options: IBuildOptions): Promise<void> {
        this._options = options;
        const { root, flagConfig, platform, mode } = options;
        const statsQuery = await StatsQuery.create(root);
        const constantManager = statsQuery.constantManager;

        if (options.features) {
            const featureUnits = statsQuery.getUnitsOfFeatures(options.features);
            this._entries = featureUnits.map(fu => normalizePath(statsQuery.getFeatureUnitFile(fu)));
        } else {
            const featureUnits = statsQuery.getFeatureUnits();
            this._entries = featureUnits.map(fu => normalizePath(statsQuery.getFeatureUnitFile(fu)));
        }
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

    }

    private _handleId (id: string, importer?: string): IHandleResult {
        const resolvedId = this._resolve(id, importer);
        if (!resolvedId) {
            throw new Error(`Cannot resolve module id: ${id}`);
        }
        const code = this._load(resolvedId);
        if (!code) {
            throw new Error(`Cannot load module: ${resolvedId}`);
        }
        const transformResult = this._transform(resolvedId, code);

        // override id for transforming import/export declaration
        let overrideId: string | undefined;
        if (id in this._virtualOverrides) {
            overrideId = this._virtualOverrides[id];
        } else if (id in this._moduleOverrides) {
            overrideId = this._moduleOverrides[id];
        } else if (!ps.isAbsolute(id) && importer) {
            const absolutePath = this._resolveRelative(id, importer);
            if (absolutePath && absolutePath in this._moduleOverrides) {
                overrideId = this._moduleOverrides[absolutePath];
            }
        }

        // handle output file
        let file = overrideId || resolvedId;
        if (file.endsWith('.json')) {
            file = file.slice(0, -5) + '.ts';
        }

        return {
            code: transformResult.code,
            file,
            originalId: id,
            resolvedId,
            map: transformResult.map,
            overrideId,
        };
    }

    private _resolve (id: string, importer?: string): string | undefined {
        if (!importer) {
            return id;  // entry
        } else if (id in this._virtualOverrides) {
            return id;  // virtual module does not have real fs path
        } else if (id in this._moduleOverrides) {
            return this._moduleOverrides[id];
        } else if (!ps.isAbsolute(id)) {
            const resolved = this._resolveRelative(id, importer);
            if (resolved) {
                return this._moduleOverrides[resolved] ?? resolved;
            }
        } 
    }

    private _resolveRelative (id: string, importer: string): string | undefined {
        for (const ext of this._resolveExtension) {
            const file = normalizePath(ps.join(ps.dirname(importer), id));
            const fileExt = file + ext;
            const indexExt = normalizePath(ps.join(file, 'index')) + ext;
            if (fs.existsSync(fileExt)) {
                return fileExt;
            } else if (fs.existsSync(indexExt)) {
                return indexExt;
            }
        }
    }

    private _load (id: string): string | void {
        if (fs.existsSync(id)) {
            let code = fs.readFileSync(id, 'utf8');
            if (id.endsWith('.json')) {
                code = `export default ${code};`
            }
            return code;
        } else if (this._virtualOverrides[id]) {
            return this._virtual2code[id];
        }
    }

    private _transform (file: string, code: string): ITransformResult {
        type ImportTypes = babel.NodePath<babel.types.ImportDeclaration> | babel.NodePath<babel.types.ExportDeclaration>;

        const importExportVisitor = (path: ImportTypes) => {
            // @ts-ignore
            const source = path.node.source;
            if (source) {
                const specifier = source.value as string;
                // handle dependency
                const handleResult = this._handleId(specifier, file);
                this._buildResult[handleResult.file] = {
                    code: handleResult.code,
                };
                // transform import/export declaration if needed
                if (handleResult.overrideId) {
                    let relativePath = normalizePath(ps.relative(ps.dirname(file), handleResult.overrideId));
                    if (!relativePath.startsWith('.')) {
                        relativePath = './' + relativePath;
                    }
                    relativePath = relativePath.slice(0, -3);  // remove '.ts'
                    
                    // traverse to transform specifier
                    traverse(path.node, {
                        StringLiteral (path: babel.NodePath<babel.types.StringLiteral>) {
                            path.replaceWith(babel.types.stringLiteral(relativePath));
                            path.skip();
                        }
                    }, path.scope);
                }
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
        };
    }
}