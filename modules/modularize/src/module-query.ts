import { MinigamePlatformConfig, ModuleConfig, NativePlatformConfig, PlatformType, WebPlatformConfig } from './module-config';
import fs from 'fs-extra';
import { MinigamePlatform, NativePlatform, WebPlatform } from './platform-config';
import glob from 'glob';
import { ps } from '@ccbuild/utils';

export interface ModuleQueryContext {
    /**
     * The engine root path.
     */
    engine: string;
    /**
     * The platform to resolve conditional export.
     */
    platform: PlatformType;
    /**
     * The custom export condition.
     * The higher the array is sorted, the higher the priority is.
     * 
     * @example
     * ```ts
     * [ 'webgl1',  'cannon' ]  // the backend of 'gfx' and 'physics' modules.
     * ```
     */
    customExportConditions?: string[];
}

/**
 * The module info manager.
 */
export class ModuleQuery {
    private _context: ModuleQueryContext;

    // cache
    private _cachedModuleName2PkgJson?: Record<string, string>;
    private _resolvedCache: Record<string, string> = {};  // module name to module entry file path
    private _cachedHasEditorSpecificExport: Record<string, boolean> = {};

    constructor (context: ModuleQueryContext) {
        this._context = context;
    }

    /**
     * Get all modules' name defined in engine workspaces.
     */
    public async getAllModules (): Promise<string[]> {
        await this._ensureModuleName2PkgJson();
        if (!this._cachedModuleName2PkgJson) {
            throw new Error(`Failed to resolve engine modules.`);
        }
        return Object.keys(this._cachedModuleName2PkgJson);
    }

    /**
     * Resolve module package.json path by module name.
     */
    public async resolvePackageJson (moduleName: string): Promise<string> {
        await this._ensureModuleName2PkgJson();
        if (!this._cachedModuleName2PkgJson) {
            throw new Error(`Failed to resolve engine modules.`);
        }
        const pkgJson = this._cachedModuleName2PkgJson[moduleName];
        if (!pkgJson) {
            throw new Error(`Failed resolve package json of module: ${moduleName}.`);
        }
        return pkgJson;
    }

    /**
     * Get module config by module name.
     */
    public async getConfig (moduleName: string): Promise<ModuleConfig> {
        const modulePath = await this.resolvePackageJson(moduleName);
        if (!modulePath) {
            throw new Error(`Failed to resolve engine module: ${moduleName}.`);
        }
        return await fs.readJson(modulePath) as ModuleConfig;
    }

    /**
     * Resolve module entry path by import source.
     */
    public async resolveExport (source: string): Promise<string | void> {
        if (this._resolvedCache[source]) {
            return this._resolvedCache[source];
        }
        if (source.startsWith('.')) {
            // no relative path resolve
            return;
        }
        const allModules = await this.getAllModules();
        const moduleName = allModules.find(moduleName => source.startsWith(moduleName));
        if (!moduleName) {
            return;
        }
        let exportPort: string = '.';
        if (ps.relative(moduleName, source) !== '') {
            exportPort = './' + ps.relative(moduleName, source);
        }

        const moduleRootDir = ps.dirname(await this.resolvePackageJson(moduleName));
        const config = await this.getConfig(moduleName);
        // NOTE: '.' export port can cover all export ports.
        const rootExport = config.exports[exportPort as '.'];
        if (!rootExport) {
            return;
        }

        // custom condition
        if (this._context.customExportConditions) {
            for (const condition of this._context.customExportConditions) {
                if (typeof rootExport[condition] === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport[condition]);
                }
            }
        }

        // platform condition
        const platform = this._context.platform.toLowerCase();
        if (this._isWebPlatform(platform)) {
            if (typeof rootExport.web === 'string') {
                return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.web);
            } else if (typeof rootExport.web === 'object') {
                if (typeof rootExport.web[platform] === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.web[platform]!);
                } else if (typeof rootExport.web.default === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.web.default);
                }
            }
        } else if (this._isMiniGamePlatform(platform)) {
            if (typeof rootExport.minigame === 'string') {
                return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.minigame);
            } else if (typeof rootExport.minigame === 'object') {
                if (typeof rootExport.minigame[platform] === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.minigame[platform]!);
                } else if (typeof rootExport.minigame.default === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.minigame.default);
                }
            }
        } else if (this._isNativePlatform(platform)) {
            if (typeof rootExport.native === 'string') {
                return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.native);
            } else if (typeof rootExport.native === 'object') {
                if (typeof rootExport.native[platform] === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.native[platform]!);
                } else if (typeof rootExport.native.default === 'string') {
                    return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.native.default);
                }
            }
        }

        // types condition
        if (typeof rootExport.types === 'string') {
            return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport.types);
        } else if (typeof rootExport === 'string') {
            return this._resolvedCache[source] = ps.join(moduleRootDir, rootExport);
        } else {
            throw new Error(`Cannot resolve export: '${source}'.`);
        }
    }

    /**
     * To detect whether the module has a './editor' export.
     * @param moduleName 
     */
    public async hasEditorSpecificExport (moduleName: string): Promise<boolean> {
        if (typeof this._cachedHasEditorSpecificExport[moduleName] === 'boolean') {
            return this._cachedHasEditorSpecificExport[moduleName];
        }
        const pkgJson = await this.resolvePackageJson(moduleName);
        const pkg = await fs.readJson(pkgJson) as ModuleConfig;
        return this._cachedHasEditorSpecificExport[moduleName] = typeof (pkg.exports?.['./editor']) !== 'undefined';
    }

    private async _ensureModuleName2PkgJson (): Promise<void> {
        if (this._cachedModuleName2PkgJson) {
            return;
        }
        const enginePkg = await fs.readJson(ps.join(this._context.engine, 'package.json'));
        let pkgFiles: string[] = [];
        if (enginePkg.workspaces) {
            for (const ws of enginePkg.workspaces) {
                pkgFiles.push(...glob.sync(ps.join(this._context.engine, ws), {
                    ignore: '**/node_modules/**/*',
                }));
            }
        }
        pkgFiles = pkgFiles.map(file => {
            if (fs.statSync(file).isDirectory()) {
                const pkgFile = ps.join(file, 'package.json');
                if (fs.existsSync(pkgFile)) {
                    return pkgFile;
                }
            }
            return file;
        });
        pkgFiles = pkgFiles.filter(file => file.endsWith('package.json'));
        pkgFiles = pkgFiles.filter((file, index) => pkgFiles.indexOf(file) === index);
        this._cachedModuleName2PkgJson = {};
        for (const pkg of pkgFiles) {
            const name = (await fs.readJson(pkg)).name;
            this._cachedModuleName2PkgJson[name] = pkg;
        }
    }
 
    private _isWebPlatform (platform: string): platform is keyof WebPlatformConfig {
        return platform.toUpperCase() in WebPlatform || platform.toUpperCase() === 'HTML5';
    }

    private _isMiniGamePlatform (platform: string): platform is keyof MinigamePlatformConfig {
        return platform.toUpperCase() in MinigamePlatform;
    }

    private _isNativePlatform (platform: string): platform is keyof NativePlatformConfig {
        return platform.toUpperCase() in NativePlatform || platform.toUpperCase() === 'NATIVE';
    }
}