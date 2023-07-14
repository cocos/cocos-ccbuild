import * as fs from 'fs-extra';
import * as ps from 'path';
import { babel as Transformer } from '@ccbuild/transformer';
import { StatsQuery } from '@ccbuild/stats-query';
import { toExtensionLess, formatPath } from '@ccbuild/utils';
import * as json5 from 'json5';
import { ESLint } from 'eslint';
import dedent from 'dedent';
import { glob } from 'glob';

import ConstantManager = StatsQuery.ConstantManager;
import { FieldDecoratorHelper } from './field-decorator-helper';
import { externalWasmLoaderFactory } from './plugins/external-wasm-loader';
import { nodeModuleLoaderFactory } from './plugins/node-module-loader';
import { ITsEnginePlugin } from './plugins/interface';

import babel = Transformer.core;
import t = babel.types;
import traverse = babel.traverse;
type ImportTypes = babel.NodePath<babel.types.ImportDeclaration> | babel.NodePath<babel.types.ExportDeclaration>;
const pluginSyntaxTS = Transformer.plugins.syntaxTS;
const syntaxDecorators = Transformer.plugins.syntaxDecorators;

export namespace EngineBuilder {

    export interface IBuildOptions {
        root: string;
        features?: string[],
        platform: ConstantManager.PlatformType;
        mode: ConstantManager.ModeType;
        flagConfig: Partial<ConstantManager.IFlagConfig>;
        outDir?: string;
    }
    export interface IBuildResult {
        [outputFile: string]: IHandleResult;
    }
    export interface IHandleResult {
        code: string;
        file: string;
        originalId: string;
        resolvedId: string;
        map: any;
    }
    export interface ITransformResult {
        code: string;
        map?: any;
    }
}

export class EngineBuilder {
    private _options!: EngineBuilder.IBuildOptions;
    private _entries: string[] = [];
    private _entriesForPass2: Set<string> = new Set<string>();
    private _virtual2code: Record<string, string> = {};
    private _virtualOverrides: Record<string, string> = {};
    private _buildTimeConstants!: ConstantManager.BuildTimeConstants;
    private _moduleOverrides!: Record<string, string>;
    private _buildResult: EngineBuilder.IBuildResult = {};
    private _resolveExtension: string[] = ['.ts', '.js', '.json'];  // not an option
    // TODO: for now OH global interface conflict with Rect and Path, struct
    // so we need to rename them.
    private _renameMap: Record<string, string> = {
        Rect: 'RectAlias',
        Path: 'PathAlias',
        struct: 'structAlias',
    };
    private _fieldDecoratorHelper = new FieldDecoratorHelper();
    private _plugins: ITsEnginePlugin[] = [];
    private _excludeTransform = [
        /native\/external\//
    ];

    public async build (options: EngineBuilder.IBuildOptions): Promise<EngineBuilder.IBuildResult> {
        const { root } = options;
        this._buildResult = {};
        const handleIdList = async (idList: string[]): Promise<void> => {
            for (const id of idList) {
                const handleResult = await this._handleId(id);
                this._buildResult[handleResult.file] = handleResult;
            }
        };
        
        this._initPlugins(options);
        await this._initOptions(options);

        for (const plugin of this._plugins) {
            if (plugin.buildStart) {
                await plugin.buildStart();
            }
        }
        // pass1: build ts for native engine
        console.log('[Build Engine]: pass1 - traverse and compile modules');
        console.time('pass1');
        await handleIdList(this._entries);
        console.timeEnd('pass1');

        // pass2: build web version for jsb type declarations
        console.log('[Build Engine]: pass2 - apply jsb interface info');
        console.time('pass2');
        while (this._entriesForPass2.size !== 0) {
            const entries2 = Array.from(this._entriesForPass2);
            this._entriesForPass2.clear();
            this._moduleOverrides = Object.entries(this._moduleOverrides).reduce((result, [k, v]) => {
                if (!fs.existsSync(k) || !entries2.includes(k)) {
                    result[k] = v;
                }
                return result;
            }, {} as Record<string, string>);
            handleIdList(entries2);
        }
        console.timeEnd('pass2');


        if (options.outDir) {
            for (const file in this._buildResult) {
                const res = this._buildResult[file];
                const output = ps.join(options.outDir, ps.relative(root, file));
                fs.outputFileSync(output, res.code, 'utf8');
            }

            // pass3: post handle to lint import
            console.log('[Build Engine]: pass3 - linting import statement');
            console.time('pass3');
            await this._lintImport([
                formatPath(ps.join(options.outDir, '**/*.ts'))
            ]);
            console.timeEnd('pass3');

            this._buildIndex();
            await this._copyTypes();
        }

        for (const plugin of this._plugins) {
            if (plugin.buildEnd) {
                await plugin.buildEnd();
            }
        }

        return this._buildResult;
    }

    private _initPlugins (options: EngineBuilder.IBuildOptions): void {
        this._plugins.push(
            nodeModuleLoaderFactory(),
            externalWasmLoaderFactory({
                engineRoot: options.root,
                outDir: options.outDir,
            }),
        );
    }

    private async _initOptions (options: EngineBuilder.IBuildOptions): Promise<void> {
        this._options = options;
        const { root, flagConfig, platform, mode } = options;
        const statsQuery = await StatsQuery.create(root);
        const constantManager = statsQuery.constantManager;

        const features: string[] = options.features ?? statsQuery.getFeatures();
        const featureUnits = statsQuery.getUnitsOfFeatures(features);
        this._entries = featureUnits.map(fu => formatPath(statsQuery.getFeatureUnitFile(fu)));
        this._buildTimeConstants = constantManager.genBuildTimeConstants({
            platform,
            mode,
            flags: flagConfig,
        });
        const intrinsicFlags = statsQuery.getIntrinsicFlagsOfFeatures(features);
        Object.assign(this._buildTimeConstants, intrinsicFlags);
        
        this._moduleOverrides = statsQuery.evaluateModuleOverrides({
            mode: options.mode,
            platform: options.platform,
            buildTimeConstants: this._buildTimeConstants,
        });
        this._moduleOverrides = Object.entries(this._moduleOverrides).reduce((result, [k, v]) => {
            result[formatPath(k)] = formatPath(v);
            return result;
        }, {} as Record<string, string>);
        // paths in tsconfig.json 
        const tsconfigFile = ps.join(root, './tsconfig.json');
        if (fs.existsSync(tsconfigFile)) {
            const tsconfigContent = fs.readFileSync(tsconfigFile, 'utf8');
            const tsconfig = json5.parse(tsconfigContent);
            const compilerOptions = tsconfig.compilerOptions;
            if (compilerOptions && compilerOptions.baseUrl && compilerOptions.paths) {
                for (const [key, paths] of Object.entries(compilerOptions.paths) as any) {
                    this._moduleOverrides[key] = formatPath(ps.join(ps.dirname(tsconfigFile), compilerOptions.baseUrl, paths[0]));
                }
            }
        }

        this._virtual2code['internal:constants'] = constantManager.exportStaticConstants({
            platform,
            mode,
            flags: flagConfig,
        });
        this._virtual2code[this._fieldDecoratorHelper.getModuleName()] = this._fieldDecoratorHelper.genModuleSource();

        for (const virtualName in this._virtual2code) {
            this._virtualOverrides[virtualName] = formatPath(ps.join(root, '__virtual__', virtualName.replace(/:/g, '_'))) + '.ts';
        }

    }

    private async _handleId (id: string, importer?: string): Promise<EngineBuilder.IHandleResult> {
        const resolvedId = await this._resolve(id, importer);
        if (typeof resolvedId === 'undefined') {
            throw new Error(`Cannot resolve module id: ${id} ${importer ? `in file ${importer}` : ''}`);
        }
        const code = await this._load(resolvedId);
        if (typeof code === 'undefined') {
            throw new Error(`Cannot load module: ${resolvedId} ${importer ? `in file ${importer}` : ''}`);
        }

        const overrideId = this._getOverrideId(id, importer);

        // handle output file
        let file = overrideId || resolvedId;
        if (file.endsWith('.json')) {
            file = file.slice(0, -5) + '.ts';
        }

        if (this._buildResult[file]) {
            // skip cached file
            return this._buildResult[file];
        }

        const depIdList: string[] = this._getDepIdList(file, code);
        // we handle the dep module first, because we need to get the resolved dep id to transform the import specifier in current module.
        for (const depId of depIdList) {
            await this._handleId(depId, file);
        }

        const transformResult = await this._transform(resolvedId, code);
        const handleResult = this._buildResult[file] = {
            code: transformResult.code,
            file,
            originalId: id,
            resolvedId,
            map: transformResult.map,
        };

        return handleResult;
    }

    private _getOverrideId (id: string, importer?: string): string | void {
        let overrideId: string | void | undefined;
        for (const p of this._plugins) {
            overrideId = p.transformId?.(id, importer);
            if (overrideId) {
                return overrideId;
            }
        }
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

    private async _resolve (id: string, importer?: string): Promise<string | void> {
        for (const p of this._plugins) {
            const resolvedId = await p.resolve?.(id, importer);
            if (resolvedId) {
                return resolvedId;
            }
        }
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
        const file = formatPath(ps.join(ps.dirname(importer), id));
        if (ps.extname(file) && fs.existsSync(file)) {
            return file;
        }
        // resolve extension less
        for (const ext of this._resolveExtension) {
            const fileExt = file + ext;
            const indexExt = formatPath(ps.join(file, 'index')) + ext;
            if (fs.existsSync(fileExt)) {
                return fileExt;
            } else if (fs.existsSync(indexExt)) {
                return indexExt;
            }
        }
    }

    private async _load (id: string): Promise<string | void> {
        for (const p of this._plugins) {
            const loadedCode = await p.load?.(id);
            if (loadedCode) {
                return loadedCode;
            }
        }
        if (fs.existsSync(id)) {
            let code = fs.readFileSync(id, 'utf8');
            if (id.endsWith('.json')) {
                code = `export default ${code};`;
            }
            return code;
        } else if (this._virtualOverrides[id]) {
            return this._virtual2code[id];
        }
    }

    private _getDepIdList (file: string, code: string): string[] {
        const depIdList: string[] = [];
        for (const ex of this._excludeTransform) {
            if (ex.test(file)) {
                return depIdList;
            }
        }
        // eg. zlib.js dependent on zlib.d.ts
        if (ps.extname(file) === '.js') {
            const dtsFile = toExtensionLess(file) + '.d.ts';
            if (fs.existsSync(dtsFile)) {
                depIdList.push(dtsFile);  // emit the .d.ts file
            }
        }
        const importExportVisitor = (path: ImportTypes): void => {
            // @ts-expect-error TODO: fix type
            const source = path.node.source;
            if (source) {
                const specifier = source.value as string;
                // add dependency
                depIdList.push(specifier);
            }
        };
        const res = babel.parseSync(code, {
            configFile: false,
            plugins: [
                [pluginSyntaxTS],
                [syntaxDecorators, {
                    version: '2018-09',  // NOTE: only version 2018-09 of decorator proposal can support decorators before export, which we need for tsc compiler
                    decoratorsBeforeExport: true,
                }],
            ]
        });
        babel.traverse(res, {
            ImportDeclaration: importExportVisitor,
            ExportDeclaration: importExportVisitor,
        });
        return depIdList;
    }

    private async _transform (file: string, code: string): Promise<EngineBuilder.ITransformResult> {
        file = formatPath(file);
        for (const ex of this._excludeTransform) {
            if (ex.test(file)) {
                return {
                    code,
                };
            }
        }
        let needFieldHelperModule = false;
        const importExportVisitor = (path: ImportTypes): void => {
            // @ts-expect-error TODO: fix type
            const source = path.node.source;
            if (source) {
                const specifier = source.value as string;
                // transform import/export declaration if needed
                const overrideId = this._getOverrideId(specifier, file);
                if (overrideId) {
                    let relativePath = formatPath(ps.relative(ps.dirname(file), overrideId));
                    if (!relativePath.startsWith('.')) {
                        relativePath = './' + relativePath;
                    }
                    if (ps.extname(relativePath) === '.ts') {
                        relativePath = relativePath.slice(0, -3);  // remove '.ts'
                    }
                    
                    traverse(path.node, {
                        StringLiteral (path: babel.NodePath<babel.types.StringLiteral>): void {
                            path.replaceWith(babel.types.stringLiteral(relativePath));
                            path.skip();
                        },
                    }, path.scope);
                }
            }

            type Types = babel.NodePath<babel.types.ExportSpecifier | babel.types.ImportSpecifier>;
            const importExportSpecifier = (path: Types): void => {
                const name = path.node.local.name;
                const alias = this._renameMap[name];
                if (alias) {
                    path.replaceWith(babel.types.exportSpecifier(babel.types.identifier(alias), babel.types.identifier(alias)));
                }
            };

            path.traverse({
                ExportSpecifier: importExportSpecifier,
                ImportSpecifier: importExportSpecifier,
            });
        };
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const transformResult = babel.transformSync(code, {
            configFile: false,
            plugins: [
                [pluginSyntaxTS],
                [syntaxDecorators, {
                    version: '2018-09',  // NOTE: only version 2018-09 of decorator proposal can support decorators before export, which we need for tsc compiler
                    decoratorsBeforeExport: true,
                }],
                [
                    (): babel.PluginObj<babel.PluginPass> => {
                        return {
                            name: 'custom-transform',
                            pre (file): void {
                                // eslint-disable-next-line @typescript-eslint/no-this-alias
                                const pluginPass = this;
                                traverse(file.ast, {
                                    ClassProperty (path): void {
                                        const decoratorsPath = path.get('decorators');
                                        if (Array.isArray(decoratorsPath)) {
                                            const propertyValuePath = path.get('value');
                                            const helperIdentifier = self._fieldDecoratorHelper.addHelper(pluginPass.file);
                                            needFieldHelperModule = true;
                                            decoratorsPath.forEach(decPath => {
                                                const expPath = decPath.get('expression');
                                                const type = expPath.node.type;
                                                if (type === 'CallExpression') {
                                                    const decName = (expPath.node.callee as t.Identifier).name;
                                                    const args = expPath.node.arguments;
                                                    decPath.replaceWith(t.decorator(t.callExpression(
                                                        helperIdentifier,
                                                        [
                                                            t.identifier(decName),
                                                            (propertyValuePath.node ?
                                                            t.arrowFunctionExpression([],  propertyValuePath.node) :
                                                            t.nullLiteral()),
                                                            ...args
                                                        ]
                                                    )));
                                                } else if (type === 'Identifier') {
                                                    const decName = expPath.node.name;
                                                    decPath.replaceWith(t.decorator(t.callExpression(
                                                        helperIdentifier,
                                                        [
                                                            t.identifier(decName),
                                                            (propertyValuePath.node ?
                                                            t.arrowFunctionExpression([],  propertyValuePath.node) :
                                                            t.nullLiteral())
                                                        ]
                                                    )));
                                                }
                                            });
                                        }
                                    },
                                });
                            },
                            visitor: {
                                ImportDeclaration: importExportVisitor,
                                ExportDeclaration: importExportVisitor,
                                // TODO: here we rename class Rect and Path
                                CallExpression (path): void {
                                    if (path.node.callee.type === 'MemberExpression') {
                                        const memberExpressionPath = path.get('callee') as babel.NodePath<t.MemberExpression>;
                                        const objectPath = memberExpressionPath.get('object') as babel.NodePath<t.Identifier>;
                                        const name = objectPath.node.name;
                                        const alias = self._renameMap[name];
                                        if (typeof alias === 'string' && path.node.callee.object.type === 'Identifier') {
                                            objectPath.replaceWith(t.identifier(alias));
                                        }
                                        // TODO: for now, OH doesn't support standard console interface,
                                        // so we need to ignore the type checking for console call expressions.
                                        else if (name === 'console') {
                                            path.node.leadingComments = [{
                                                type: 'CommentLine',
                                                value: ' @ts-ignore',
                                            }];
                                        }
                                    } else if (path.node.callee.type === 'Import') {
                                        // TODO: for now, we transform `import('./xxx/xxx.js')` into `window.__cc_module_context__.import('./xxx/xxx.js')`
                                        // we need to support import(`project://xxx`) in the future.
                                        path.replaceWith(t.callExpression(
                                            t.memberExpression(
                                                t.memberExpression(
                                                    t.identifier('window'),
                                                    t.identifier('__cc_module_context__')
                                                ),
                                                t.identifier('import'),
                                            ),
                                            path.node.arguments,
                                        ));
                                    }
                                },
                                ClassDeclaration (path): void {
                                    const idPath = path.get('id');
                                    const name = idPath.node.name;
                                    const alias = self._renameMap[name];
                                    if (typeof alias === 'string') {
                                        idPath.replaceWith(t.identifier(alias));
                                    }
                                },
                                NewExpression (path): void {
                                    const calleePath = path.get('callee');
                                    // @ts-expect-error TODO: fix type
                                    const name = calleePath.node.name;
                                    if (name) {
                                        const alias = self._renameMap[name];
                                        if (typeof alias === 'string') {
                                            calleePath.replaceWith(t.identifier(alias));
                                        }
                                    }
                                },
                                TSTypeAnnotation (path): void {
                                    // @ts-expect-error TODO: fix type
                                    const typeName = path.node.typeAnnotation.typeName;
                                    const childPath = path.get('typeAnnotation');
                                    if (typeName) {
                                        const name = typeName.name as string;
                                        const alias = self._renameMap[name];
                                        if (typeof alias === 'string') {
                                            path.replaceWith(t.tsTypeAnnotation({
                                                type: 'TSExpressionWithTypeArguments',
                                                expression: t.identifier(alias),
                                            }));
                                        }
                                    } else if (childPath.type === 'TSLiteralType') {
                                        const literalPath = (childPath as babel.NodePath<t.TSLiteralType>).get('literal');
                                        if (literalPath.type === 'TemplateLiteral') {
                                            path.replaceWith(t.tsTypeAnnotation(t.tsStringKeyword()));
                                        }
                                        
                                    }
                                },
                                Identifier (path): void {
                                    const name = path.node.name;
                                    const alias = self._renameMap[name];
                                    if (typeof alias === 'string') {
                                        if (path.parent.type === 'ObjectProperty' || path.parent.type === 'TSPropertySignature') {
                                            if (path.parent.key !== path.node) {
                                                path.replaceWith(t.identifier(alias));
                                            }
                                        } else if (path.parent.type === 'MemberExpression' || path.parent.type === 'OptionalMemberExpression') {
                                            if (path.parent.property !== path.node) {
                                                path.replaceWith(t.identifier(alias));
                                            }
                                        } else if (!(path.parent.type === 'ClassMethod' && (path.parent.kind === 'get' || path.parent.kind === 'set' || path.parent.key === path.node)) 
                                            && path.parent.type !== 'ClassProperty'){
                                            const newIdentifier = t.identifier(alias);
                                            if (path.node.typeAnnotation) {
                                                newIdentifier.typeAnnotation = path.node.typeAnnotation;
                                            }
                                            path.replaceWith(newIdentifier);
                                        }
                                    }
                                },
                            }
                        } as babel.PluginObj;
                    }
                ]
            ],
        });
        if (needFieldHelperModule) {
            await this._handleId(this._fieldDecoratorHelper.getModuleName(), file);
        }
        return {
            code: transformResult?.code!,
        };
    }

    private async _lintImport (lintFiles: string[], verbose = false): Promise<void> {
        const eslint = new ESLint({ fix: true, 
            cwd: __dirname,  // fix not found parser issue
            resolvePluginsRelativeTo: __dirname,  // fix not found plugins issue
            useEslintrc: false,
            baseConfig: {
                parser: '@typescript-eslint/parser',
                plugins: ['@typescript-eslint', 'unused-imports'],
                rules: {
                    '@typescript-eslint/consistent-type-imports': 'error',
                    'unused-imports/no-unused-imports': 'error',
                },
        }});

        const results = await eslint.lintFiles(lintFiles);

        await ESLint.outputFixes(results);
        
        if (verbose) {
            const formatter = await eslint.loadFormatter();
            const resultText = formatter.format(results);
            console.log(resultText);
        }
    }

    private _buildIndex (): void {
        const { outDir, root } = this._options;
        if (outDir) {
            const indexFile = formatPath(ps.join(outDir, 'index.ts'));
            const ccFile = formatPath(ps.join(outDir, 'cc.ts'));
            const systemCCFile = formatPath(ps.join(outDir, 'system-cc.js'));
            let indexContent = '';
            this._entries.forEach(item => {
                const relative = formatPath(ps.relative(root, toExtensionLess(item)));
                indexContent += `export * from './${relative}';\n`;
            });
            const ccContent = dedent`import * as cc from './index';
            // @ts-ignore
            window.cc_module = cc;`;
            const systemCCContent = dedent`System.register([], function (exports, module) {
                return {
                    execute: function () {
                        window.__cc_module_context__ = module;
            
                        exports(window.cc_module);
                    }
                };
            });
            `;
            fs.outputFileSync(indexFile, indexContent, 'utf8');
            fs.outputFileSync(ccFile, ccContent, 'utf8');
            fs.outputFileSync(systemCCFile, systemCCContent, 'utf8');
        }

    }

    private async _copyTypes (): Promise<void> {
        const { root, outDir } = this._options;
        if (!outDir) {
            return;
        }
        const dtsFiles = glob.sync(formatPath(ps.join(root, './@types/**/*.d.ts')));
        for (const file of dtsFiles) {
            const code = fs.readFileSync(file, 'utf8');
            const relativePath = ps.relative(root, file);
            const targetPath = formatPath(ps.join(outDir, relativePath));
            fs.outputFileSync(targetPath, code, 'utf8');
        }
        // copy lib.dom.d.ts
        // we use 4.2 version of typescript
        const originalDomDts = formatPath(ps.join(__dirname, '../../../../static/lib.dom.d.ts'));
        const targetDomDts = formatPath(ps.join(outDir, '@types/lib.dom.d.ts'));
        const code = fs.readFileSync(originalDomDts, 'utf8');
        fs.outputFileSync(targetDomDts, code, 'utf8');
    }
}