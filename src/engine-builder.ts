import { IFlagConfig, PlatformType } from "./config-parser";

export interface IBuildOptions {
    entries: string[];
    platform: PlatformType;
    flagConfig: Partial<IFlagConfig>;
}

export interface IBuildResult {
    [fileName: string]: {
        code: string;
        map: string;
    }
}

export class EngineBuilder {
    constructor () {

    }

    build (options: IBuildOptions): Promise<IBuildResult> {
        return new Promise(resolve => {
            resolve({})
        });
    }
}