import * as fs from 'fs-extra';
import * as ps from 'path';
import { IFlagConfig, PlatformType } from "./config-parser";

export interface IBuildOptions {
    root: string;
    entries: string[];
    platform: PlatformType;
    flagConfig: Partial<IFlagConfig>;
    resolveExtensions: string[];
}

export interface IBuildResult {
    [fileName: string]: {
        code: string;
        map?: string;
    }
}

export class EngineBuilder {
    private _resolveExtensions = ['.ts'];

    constructor () {

    }

    build (options: IBuildOptions): Promise<IBuildResult> {
        return new Promise(resolve => {
            const { root, resolveExtensions, } = options;
            this._resolveExtensions = resolveExtensions ?? this._resolveExtensions;
            const result: IBuildResult = {};
            options.entries.forEach(item => {
                item = ps.join(options.root, item).replace(/\\/g, '/');
                const code = fs.readFileSync(item, 'utf-8');
                // TODO: ast traverse to parse dependency
                result[item] = {
                    code
                };
            });
            
            resolve(result)
        });
    }
}