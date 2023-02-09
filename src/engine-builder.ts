import * as fs from 'fs-extra';
import * as ps from 'path';
import * as babel from '@babel/core';
// @ts-ignore
import pluginSyntaxTS from '@babel/plugin-syntax-typescript';
// @ts-ignore
import syntaxDecorators from '@babel/plugin-syntax-decorators';
import traverse from '@babel/traverse';
import { BuildTimeConstants, FlagType, IFlagConfig, ModeType, PlatformType, StatsQuery } from "./stats-query";
import { normalizePath, toExtensionLess } from './stats-query/path-utils';
import * as json5 from 'json5';

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
}

interface ITransformResult {
    code: string;
    map?: any;
    depIdList: string[],
}

export interface IBuildResult {
    [outputFile: string]: IHandleResult;
}

export class EngineBuilder {
    private _options!: IBuildOptions;
    private _entries: string[] = [];
    private _entriesForPass2: Set<string> = new Set<string>;
    private _virtual2code: Record<string, string> = {};
    private _virtualOverrides: Record<string, string> = {};
    private _buildTimeConstants!: BuildTimeConstants;
    private _moduleOverrides!: Record<string, string>;
    private _resolveExtension: string[] = ['.ts', '.js', '.json'];  // not an option
    private _buildResult: IBuildResult = {};

    public async build (options: IBuildOptions): Promise<IBuildResult> {
        const { root } = options;
        this._buildResult = {};
        const handleIdList = (idList: string[]) => {
            for (let id of idList) {
                const handleResult = this._handleId(id);
                this._buildResult[handleResult.file] = handleResult;
            }
        };
        
        // pass1: build ts for native engine
        await this._initOptions(options);
        handleIdList(this._entries);

        // pass2: build web version for jsb type declarations
        this._moduleOverrides = Object.entries(this._moduleOverrides).reduce((result, [k, v]) => {
            if (!fs.existsSync(k)) {
                result[k] = v;
            }
            return result;
        }, {} as Record<string, string>);
        handleIdList(Array.from(this._entriesForPass2));


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
        // paths in tsconfig.json 
        const tsconfigFile = ps.join(root, './tsconfig.json');
        if (fs.existsSync(tsconfigFile)) {
            const tsconfigContent = fs.readFileSync(tsconfigFile, 'utf8');
            const tsconfig = json5.parse(tsconfigContent);
            const compilerOptions = tsconfig.compilerOptions;
            if (compilerOptions && compilerOptions.baseUrl && compilerOptions.paths) {
                for (let [key, paths] of Object.entries(compilerOptions.paths) as any) {
                    this._moduleOverrides[key] = normalizePath(ps.join(ps.dirname(tsconfigFile), compilerOptions.baseUrl, paths[0]));
                }
            }
        }

        this._virtual2code['internal:constants'] = constantManager.exportStaticConstants({
            platform,
            mode,
            flags: flagConfig,
        });
        // TODO: resolve node modules
        this._virtual2code['@cocos/dragonbones-js'] = 'export {}';
        this._virtual2code['@cocos/box2d'] = 'export {}';
        this._virtual2code['@cocos/bullet'] = 'export {}';
        this._virtual2code['@cocos/cannon'] = 'export {}';

        for (let virtualName in this._virtual2code) {
            this._virtualOverrides[virtualName] = normalizePath(ps.join(root, '__virtual__', virtualName.replace(/:/g, '_'))) + '.ts';
        }

    }

    private _handleId (id: string, importer?: string): IHandleResult {
        const resolvedId = this._resolve(id, importer);
        if (typeof resolvedId === 'undefined') {
            throw new Error(`Cannot resolve module id: ${id} ${importer ? `in file ${importer}` : ''}`);
        }
        const code = this._load(resolvedId);
        if (typeof code === 'undefined') {
            throw new Error(`Cannot load module: ${resolvedId} ${importer ? `in file ${importer}` : ''}`);
        }

        let overrideId = this._getOverrideId(id, importer);

        // handle output file
        let file = overrideId || resolvedId;
        if (file.endsWith('.json')) {
            file = file.slice(0, -5) + '.ts';
        }

        if (this._buildResult[file]) {
            // skip cached file
            return this._buildResult[file];
        }

        const transformResult = this._transform(resolvedId, code);
        const handleResult = this._buildResult[file] = {
            code: transformResult.code,
            file,
            originalId: id,
            resolvedId,
            map: transformResult.map,
        };

        transformResult.depIdList.forEach(id => {
            const handleResult = this._handleId(id, file);
            this._buildResult[handleResult.file] = handleResult;
        });

        return handleResult;
    }

    private _getOverrideId (id: string, importer?: string): string | void {
        let overrideId: string | undefined;
        if (id in this._virtualOverrides) {
            overrideId = this._virtualOverrides[id];
        } else if (id in this._moduleOverrides) {
            overrideId = this._moduleOverrides[id];
        } else if (!ps.isAbsolute(id) && importer) {
            const absolutePath = this._resolveRelative(id, importer);
            if (absolutePath && this._moduleOverrides[absolutePath] === importer) {
                this._entriesForPass2.add(absolutePath);  // for next pass
                return;
            }
            if (absolutePath && absolutePath in this._moduleOverrides) {
                overrideId = this._moduleOverrides[absolutePath];
            }
        }
        return overrideId;
    }

    private _resolve (id: string, importer?: string): string | void {
        if (!importer) {
            return id;  // entry
        } else if (id in this._virtualOverrides) {
            return id;  // virtual module does not have real fs path
        } else if (id in this._moduleOverrides) {
            return this._moduleOverrides[id];
        } else if (ps.isAbsolute(id)) {
            return id;
        } else {
            const resolved = this._resolveRelative(id, importer);
            if (resolved) {
                return this._moduleOverrides[resolved] ?? resolved;
            }
        }
    }

    private _resolveRelative (id: string, importer: string): string | undefined {
        const file = normalizePath(ps.join(ps.dirname(importer), id));
        if (ps.extname(file) && fs.existsSync(file)) {
            return file;
        }
        // resolve extension less
        for (const ext of this._resolveExtension) {
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
        const depIdList: string[] = [];
        if (ps.extname(file) === '.js') {
            const dtsFile = toExtensionLess(file) + '.d.ts';
            if (fs.existsSync(dtsFile)) {
                depIdList.push(dtsFile);
            }
        }
        type ImportTypes = babel.NodePath<babel.types.ImportDeclaration> | babel.NodePath<babel.types.ExportDeclaration>;
        const importExportVisitor = (path: ImportTypes) => {
            // @ts-ignore
            const source = path.node.source;
            if (source) {
                const specifier = source.value as string;
                // add dependency
                depIdList.push(specifier);
                // transform import/export declaration if needed
                const overrideId = this._getOverrideId(specifier, file);
                if (overrideId) {
                    let relativePath = normalizePath(ps.relative(ps.dirname(file), overrideId));
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
            depIdList,
        };
    }
}