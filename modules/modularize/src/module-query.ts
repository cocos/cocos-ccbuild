import { MinigamePlatformConfig, ModuleConfig, NativePlatformConfig, WebPlatformConfig } from './module-config';
import fs from 'fs-extra';
import { StatsQuery } from '@ccbuild/stats-query';
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
    platform: StatsQuery.ConstantManager.PlatformType;
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
    private _cachedAllModules?: string[];
    private _resolvedCache: Record<string, string> = {};  // module name to module entry file path

    constructor (context: ModuleQueryContext) {
        this._context = context;
    }

    /**
     * Get all modules' name defined in engine workspaces.
     */
    public async getAllModules (): Promise<string[]> {
        if (this._cachedAllModules) {
            return this._cachedAllModules;
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
        pkgFiles = pkgFiles.filter(file => file.endsWith('package.json'));
        const moduleNames: string[] = [];
        for (const pkg of pkgFiles) {
            const name = (await fs.readJson(pkg)).name;
            moduleNames.push(name);
        }
        return this._cachedAllModules = moduleNames;
    }

    /**
     * Resolve module package.json path by module name.
     */
    public resolvePackageJson (moduleName: string): string {
        return require.resolve(moduleName, {
            paths: [this._context.engine],
        });
    }

    /**
     * Get module config by module name.
     */
    public async getConfig (moduleName: string): Promise<ModuleConfig> {
        const modulePath = this.resolvePackageJson(moduleName);
        return await fs.readJson(modulePath) as ModuleConfig;
    }

    /**
     * Resolve module entry path of '.' conditional export by module name.
     */
    public async resolveExport (moduleName: string): Promise<string> {
        if (this._resolvedCache[moduleName]) {
            return this._resolvedCache[moduleName];
        }

        const moduleRootDir = ps.dirname(this.resolvePackageJson(moduleName));
        const config = await this.getConfig(moduleName);
        const rootExport = config.exports['.'];

        // custom condition
        if (this._context.customExportConditions) {
            for (const condition of this._context.customExportConditions) {
                if (typeof rootExport[condition] === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport[condition]);
                }
            }
        }

        // platform condition
        const platform = this._context.platform.toLowerCase();
        if (this._isWebPlatform(platform)) {
            if (typeof rootExport.web === 'string') {
                return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.web);
            } else if (typeof rootExport.web === 'object') {
                if (typeof rootExport.web[platform] === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.web[platform]!);
                } else if (typeof rootExport.web.default === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.web.default);
                }
            }
        } else if (this._isMiniGamePlatform(platform)) {
            if (typeof rootExport.minigame === 'string') {
                return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.minigame);
            } else if (typeof rootExport.minigame === 'object') {
                if (typeof rootExport.minigame[platform] === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.minigame[platform]!);
                } else if (typeof rootExport.minigame.default === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.minigame.default);
                }
            }
        } else if (this._isNativePlatform(platform)) {
            if (typeof rootExport.native === 'string') {
                return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.native);
            } else if (typeof rootExport.native === 'object') {
                if (typeof rootExport.native[platform] === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.native[platform]!);
                } else if (typeof rootExport.native.default === 'string') {
                    return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.native.default);
                }
            }
        }

        // types condition
        if (typeof rootExport.types === 'string') {
            return this._resolvedCache[moduleName] = ps.join(moduleRootDir, rootExport.types);
        } else {
            throw new Error(`Please specify a least a types export for module: '${moduleName}'.`);
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