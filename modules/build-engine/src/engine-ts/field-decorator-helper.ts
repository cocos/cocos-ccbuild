import * as fs from 'fs-extra';
import * as ps from 'path';
import { babel as Transformer } from "@ccbuild/transformer";
import { addNamed } from '@babel/helper-module-imports';

import BabelFile = Transformer.core.BabelFile;
import t = Transformer.core.types;

export class FiledDecoratorHelper {
    private _moduleName = 'CCBUILD_HELPER_MODULE';
    private _moduleSource?: string;
    private _file2NamedIdentifier: WeakMap<BabelFile, t.Identifier> = new WeakMap();

    getModuleName (): string {
        return this._moduleName;
    }

    genModuleSource (): string {
        if (this._moduleSource) {
            return this._moduleSource;
        }
        return this._moduleSource = fs.readFileSync(ps.join(__dirname, '../../../../static/helper-file-decorator.ts'), 'utf8');
    }

    addHelper (file: BabelFile): t.Identifier {
        let namedIdentifier = this._file2NamedIdentifier.get(file);
        if (namedIdentifier) {
            return namedIdentifier;
        }
        namedIdentifier = addNamed(file.path, 'CCBuildTsFieldDecoratorHelper', this._moduleName);
        this._file2NamedIdentifier.set(file, namedIdentifier);
        return namedIdentifier;
    }
}