import fs from 'fs-extra';
import * as gift from '@cocos/tfig';
import { StatsQuery } from '@ccbuild/stats-query';
import { ps } from '@ccbuild/utils';
import { typescript as Transformer } from '@ccbuild/transformer';
import { ModuleQuery } from '@ccbuild/modularize';


import ts = Transformer.core;

const DEBUG = false;
const REMOVE_OLD = !DEBUG;
const RECOMPILE = !DEBUG;
const REMOVE_UNBUNDLED_CACHE = !DEBUG;

export interface Options {
    engine: string;
    outDir: string;
}

export async function build (options: Options): Promise<boolean> {
    console.log(`Typescript version: ${ts.version}`);

    const {
        engine,
        outDir,
    } = options;
    await fs.ensureDir(outDir);

    // TODO: should this be a build options ?
    const withIndex = true;
    const withExports = false;
    const withEditorExports = true;

    console.debug(`With index: ${withIndex}`);
    console.debug(`With exports: ${withExports}`);
    console.debug(`With editor exports: ${withEditorExports}`);

    const statsQuery = await StatsQuery.create(engine);
    const moduleQuery = new ModuleQuery({
        engine,
        platform: 'WEB_EDITOR',  // what ever platform is OK
        customExportConditions: ['types'],
    });
    const moduleExportMap = await moduleQuery.getExportMap();
    // NOTE: to record the imported modules, we only bundle the imported modules, not all engine modules.
    const importedModules: string[] = [];

    const tsConfigPath = statsQuery.tsConfigPath;

    const unbundledOutDir = ps.join(engine, '__dts_before_bundle');
    const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
        tsConfigPath, {
            declaration: true,
            noEmit: false,
            emitDeclarationOnly: true,
            outFile: undefined,
            outDir: unbundledOutDir,
        }, {
            onUnRecoverableConfigFileDiagnostic: () => {},
            useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
            readDirectory: ts.sys.readDirectory,
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile,
        },
    );
    if (!parsedCommandLine) {
        throw new Error(`Can not get 'parsedCommandLine'.`);
    }

    const unbundledOutDirNormalized = ps.resolve(engine, parsedCommandLine.options.outDir!);
    console.debug(`Unbundled will write to: ${unbundledOutDirNormalized}`);

    await fs.ensureDir(unbundledOutDirNormalized);
    if (REMOVE_OLD) {
        await fs.emptyDir(unbundledOutDirNormalized);
    }

    console.log(`Generating...`);

    const featureUnits = statsQuery.getFeatureUnits().filter((m) => m !== 'wait-for-ammo-instantiation');

    const editorExportModules = statsQuery.getEditorPublicModules();

    if (RECOMPILE) {
        let fileNames = parsedCommandLine.fileNames;
        if (withEditorExports) {
            fileNames = fileNames.concat(editorExportModules.map((e) => statsQuery.getEditorPublicModuleFile(e)));
        }

        const host = ts.createCompilerHost(parsedCommandLine.options);
        host.resolveModuleNames = (moduleNames, importer): (ts.ResolvedModule | undefined)[] => {
            const resolvedModules: (ts.ResolvedModule | undefined)[] = [];
            for (const moduleName of moduleNames) {
                const exportPath = moduleExportMap[moduleName];
                if (exportPath) {
                    if (!importedModules.includes(moduleName)) {
                        importedModules.push(moduleName);
                    }
                    resolvedModules.push({resolvedFileName: exportPath});
                } else {
                    const resolvedRes = ts.resolveModuleName(moduleName, importer, parsedCommandLine.options, host);
                    if (resolvedRes.resolvedModule) {
                        resolvedModules.push({resolvedFileName: resolvedRes.resolvedModule.resolvedFileName});
                    } else {
                        // Cannot resolve module, treat it as external.
                        resolvedModules.push(undefined);
                    }
                }
            }
            return resolvedModules;
        };
        const program = ts.createProgram(fileNames, parsedCommandLine.options, host);
        const emitResult = program.emit(
            undefined, // targetSourceFile
            undefined, // writeFile
            undefined, // cancellationToken,
            true, // emitOnlyDtsFiles
            undefined, // customTransformers
        );

        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        for (const diagnostic of allDiagnostics) {
            let printer;
            switch (diagnostic.category) {
            case ts.DiagnosticCategory.Error:
                printer = console.error;
                break;
            case ts.DiagnosticCategory.Warning:
                printer = console.warn;
                break;
            case ts.DiagnosticCategory.Message:
            case ts.DiagnosticCategory.Suggestion:
            default:
                printer = console.log;
                break;
            }
            if (!printer) {
                continue;
            }
            if (diagnostic.file && diagnostic.start !== undefined) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine);
                printer(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                printer(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
            }
        }
    }

    const patchSpineCoreDtsSource = ps.join(engine, 'cocos', 'spine', 'lib', 'spine-core.d.ts');
    const patchSpineCoreDtsTarget = ps.join(unbundledOutDirNormalized, 'cocos', 'spine', 'lib', 'spine-core.d.ts');
    if (!await fs.pathExists(patchSpineCoreDtsSource)) {
        console.debug(`Does 'cocos/spine/lib/spine-core.d.ts' no longer existed? I have a patch for it.`);
    } else {
        console.debug(`It's ${new Date().toLocaleString()}, we're still doing the hack for spine-core.d.ts`);
        await fs.ensureDir(ps.dirname(patchSpineCoreDtsTarget));
        await fs.copyFile(
            patchSpineCoreDtsSource,
            patchSpineCoreDtsTarget,
        );
    }

    const rebasedModuleExportMap: Record<string, string> = {};
    for (const [moduleName, modulePath] of Object.entries(moduleExportMap)) {
        let rebasedPath = ps.rebasePath(modulePath, engine, unbundledOutDirNormalized);
        if (!rebasedPath.endsWith('.d.ts')) {
            rebasedPath = ps.replaceExtname(rebasedPath, '.ts', '.d.ts');
        }
        rebasedModuleExportMap[moduleName] = rebasedPath;
    }

    const giftInputs: string[] = [];
    const types = parsedCommandLine.options.types?.map((typeFile) => `${typeFile}.d.ts`);
    if (types) {
        for (let file of types) {
            const isBareSpecifier = !file.includes('/');
            if (isBareSpecifier) {
                file = require.resolve(`@types/${file.slice(0, -'.d.ts'.length)}`, {
                    paths: [engine]
                });
            }
            if (!ps.isAbsolute(file)) {
                file = ps.join(ps.dirname(tsConfigPath), file);
            }
            giftInputs.push(file);
        }
    }
    const listGiftInputs = async (dir: string): Promise<void> => {
        for (const file of await fs.readdir(dir)) {
            const path = ps.join(dir, file);
            // eslint-disable-next-line no-await-in-loop
            const stats = await fs.stat(path);
            if (stats.isFile()) {
                giftInputs.push(path);
            } else if (stats.isDirectory()) {
                // eslint-disable-next-line no-await-in-loop
                await listGiftInputs(path);
            }
        }
    };
    await listGiftInputs(unbundledOutDirNormalized);

    const giftEntries: Record<string, string> = { };
    for (const [moduleName, modulePath] of Object.entries(rebasedModuleExportMap)) {
        if (importedModules.includes(moduleName)) {
            giftInputs.push(modulePath);
        }
    }

    const getModuleNameInTsOutFile = (moduleFile: string): string => {
        const path = ps.relative(statsQuery.path, moduleFile);
        const pathDts = path.replace(/\.ts$/, '.d.ts');
        return ps.join(unbundledOutDirNormalized, pathDts);
    };

    if (withExports) {
        for (const exportEntry of featureUnits) {
            giftEntries[exportEntry] = getModuleNameInTsOutFile(
                statsQuery.getFeatureUnitFile(exportEntry),
            );
        }
    }

    if (withEditorExports) {
        for (const editorExportModule of editorExportModules) {
            giftEntries[editorExportModule] = getModuleNameInTsOutFile(
                statsQuery.getEditorPublicModuleFile(editorExportModule),
            );
        }
        for (const [moduleName, modulePath] of Object.entries(rebasedModuleExportMap)) {
            if (moduleName.endsWith('/editor') && importedModules.includes(moduleName)) {
                const editorModuleName = transformToEditorModuleName(moduleName);
                giftEntries[editorModuleName] = modulePath;
            }
        }
    }

    let ccDtsFile: string | undefined;
    if (withIndex && !withExports) {
        ccDtsFile = ps.join(unbundledOutDirNormalized, 'virtual-cc.d.ts');
        giftEntries.cc = ccDtsFile;
        giftInputs.push(ccDtsFile);
        const code = `// Auto-generated\n${
            statsQuery.evaluateIndexModuleSource(featureUnits,
                (featureUnit) => getModuleNameInTsOutFile(statsQuery.getFeatureUnitFile(featureUnit)).replace(/\\/g, '/').replace(/\.d.ts$/, ''))
        }\n`;
        await fs.writeFile(ccDtsFile, code, { encoding: 'utf8' });
    }

    console.log(`Bundling...`);
    try {
        const indexOutputPath = ps.join(outDir, 'cc.d.ts');
        const giftResult = gift.bundle({
            input: giftInputs,
            rootDir: unbundledOutDirNormalized,
            name: 'cc',
            rootModule: 'index',
            entries: giftEntries,
            priority: [
                ...(ccDtsFile ? [ccDtsFile] : []), // Things should be exported to 'cc' as far as possible.
            ],
            privateJsDocTag: 'engineInternal',
            groups: [
                { test: /^cc\/editor.*$/, path: ps.join(outDir, 'cc.editor.d.ts') },
                { test: /^cc\/.*$/, path: ps.join(outDir, 'index.d.ts') },
                { test: /^cc.*$/, path: indexOutputPath },
            ],
            nonExportedSymbolDistribution: [{
                sourceModule: /cocos\/animation\/marionette/,
                targetModule: 'cc/editor/new-gen-anim',
            }, {
                sourceModule: /.*/, // Put everything non-exported that 'cc' encountered into 'cc'
                targetModule: 'cc',
            }],
            moduleMap: rebasedModuleExportMap,
        });

        await Promise.all(giftResult.groups.map(async (group) => {
            await fs.outputFile(group.path, group.code, { encoding: 'utf8' });
        }));

        if (withIndex && withExports) {
            await fs.outputFile(
                indexOutputPath,
                buildIndexModule(featureUnits, statsQuery),
                { encoding: 'utf8' },
            );
        }
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        if (REMOVE_UNBUNDLED_CACHE) {
            await fs.remove(unbundledOutDirNormalized);
        }
    }

    return true;
}

function buildIndexModule (featureUnits: string[], statsQuery: StatsQuery): string {
    return `declare module "cc" {\n${
        statsQuery.evaluateIndexModuleSource(featureUnits)
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n')
    }\n}`;
}

/**
 * '@cocos/moduleName' -> 'cc/editor/moduleName'
 * '@cocos/moduleName/editor' -> 'cc/editor/moduleName'
 * 'moduleName' -> 'cc/editor/moduleName'
 * @param moduleName 
 */
function transformToEditorModuleName (moduleName: string): string {
    const split = moduleName.split('/');
    moduleName = split.length > 1 ? split[1] : split[0];
    return `cc/editor/${moduleName}`;
}
