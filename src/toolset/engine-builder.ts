import { IFlagConfig, IPlatformConfig } from "./config-parser";

export interface IBuildOptions {
    root: string;
    entries: string[];
    platformConfig: Partial<IPlatformConfig>;
    flagConfig: Partial<IFlagConfig>,
}

export interface IBuildResult {
    [fileName: string]: {
        code: string;
        map: string;
    }
}

export interface IGenerateOptions {

}

export class EngineBuilder {
    constructor () {

    }

    build (options: IBuildOptions): Promise<IBuildResult> {
        return new Promise(resolve => {
            resolve({})
        });
    }

    generate (options: IGenerateOptions): Promise<void> {
        return new Promise(resolve => {
            resolve();
        });
    }
}