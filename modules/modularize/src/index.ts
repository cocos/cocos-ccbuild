import fs from 'fs-extra';
import ps from 'path';
import ejs from 'ejs';
import { absolutePathFuncFactory, formatPath, rebasePath, replaceExtname } from '@ccbuild/utils';

const absolutePath = absolutePathFuncFactory(__dirname);

export class MemoryFile {
    public path: string;
    public content: string;

    constructor (path: string, content: string) {
        this.path = path;
        this.content = content;
    }

    public async outputFile (): Promise<void> {
        await fs.outputFile(this.path, this.content, 'utf8');
    }
}

export declare namespace ModuleManager {
    export interface InitOptions {
        pkgName: string;
        extendTsconfigPath: string;
    }

    export interface ModuleInitResult {
        memoryFiles: MemoryFile[];
    }
}

export class ModuleManager {

    private _filesToCopy = [
        '../static/jest.config.js',
        '../static/api-extractor.json',
        '../static/.gitignore',
    ];

    private _filesToRender = [
        '../static/package.ejson',
        '../static/tsconfig.ejson'
    ];

    async initModule (modulePath: string, options: ModuleManager.InitOptions): Promise<ModuleManager.ModuleInitResult> {
        const result: ModuleManager.ModuleInitResult = { memoryFiles: [] };
        await Promise.all(this._filesToRender.map(filePath => absolutePath(filePath)).map(async filePath => {
            const content = await fs.readFile(filePath, 'utf8');
            const targetContent = ejs.render(content, options);
            const targetFilePath = replaceExtname(rebasePath(filePath, ps.dirname(filePath), modulePath), '.json');
            options.extendTsconfigPath = formatPath(ps.relative(modulePath, options.extendTsconfigPath));
            result.memoryFiles.push(new MemoryFile(targetFilePath, targetContent));
        }));
        await Promise.all(this._filesToCopy.map(filePath => absolutePath(filePath)).map(async filePath => {
            const content = await fs.readFile(filePath, 'utf8');
            const targetFilePath = rebasePath(filePath, ps.dirname(filePath), modulePath);
            result.memoryFiles.push(new MemoryFile(targetFilePath, content));
        }));
        return result;
    }
}
