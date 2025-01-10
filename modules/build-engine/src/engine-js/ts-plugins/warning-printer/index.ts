// This code was modified from https://github.com/timocov/ts-transformer-minify-privates

import * as ts from '@cocos/typescript';

export interface IWarningPrinterOptions {
    warnThisDotThreshold: number;
    warnNoConstructorFound: boolean;
}

const defaultOptions: IWarningPrinterOptions = {
    warnThisDotThreshold: 0,
    warnNoConstructorFound: false,
};

export class WarningPrinter {
    private readonly _context: ts.TransformationContext;
    private readonly _options: IWarningPrinterOptions;
    private _currentProgram: ts.Program | null = null;
    private _currentSourceFile: ts.SourceFile | null = null;
    private _typeChecker!: ts.TypeChecker;

    public constructor(context: ts.TransformationContext, options?: Partial<IWarningPrinterOptions>) {
        this._context = context;
        this._options = { ...defaultOptions, ...options };
    }

    public visitSourceFile(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile {
        this._currentProgram = program;
        this._currentSourceFile = node;
        this._typeChecker = program.getTypeChecker();
        if (this._currentSourceFile.fileName.includes('minigame/handle-input.ts')) {
            console.log('Found pal file:', this._currentSourceFile.fileName);
        }
        const result = this.visitNodeAndChildren(node, program, context);
        this._currentProgram = null;
        this._currentSourceFile = null;
        return result;
    }

    private visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
    private visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;
    private visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
        return ts.visitEachChild(
            this.visitNode(node, program),
            (childNode: ts.Node) => this.visitNodeAndChildren(childNode, program, context),
            context
        );
    }

    private getNodeByKind(children: ts.Node[], kind: ts.SyntaxKind): ts.Node | null {
        for (const child of children) {
            if (child.kind === kind) {
                return child;
            }

            if (child.kind === ts.SyntaxKind.SyntaxList) {
                const foundNode = this.getNodeByKind(child.getChildren(), kind);
                if (foundNode) {
                    return foundNode;
                }
            }
        }
        return null;
    }

    private visitNode(node: ts.Node, program: ts.Program): ts.Node {
        if (ts.isClassDeclaration(node)) {
            if (this._options.warnNoConstructorFound) {
                this.checkHaveConstructor(node);
            }
        } else if (ts.isBlock(node)) {
            if (this._options.warnThisDotThreshold > 0) {
                this.checkThisDotCountInBlock(node);
            }
        }
        return node;
    }

    private checkHaveConstructor(node: ts.ClassDeclaration): void {
        const children = node.getChildren(this._currentSourceFile!);
        const foundConstructor = this.getNodeByKind(children, ts.SyntaxKind.Constructor);
        if (!foundConstructor && (!node.parent || !ts.isBlock(node.parent))) {
            const heritageClause = this.getNodeByKind(children, ts.SyntaxKind.HeritageClause) as ts.HeritageClause | null;
            if (heritageClause) {
                if (heritageClause.token !== ts.SyntaxKind.ExtendsKeyword) {
                    return;
                }

                const filePath = this._currentSourceFile?.fileName || '';
                if (!filePath.includes('node_modules')) {
                    console.warn(`[OPTIMIZE ME] Class ( ${node.name?.getText()} ) doesn't have a default constructor, ${filePath}`);
                }
            }
        }
    }

    private checkThisDotCountInBlock(node: ts.Block): void {
        if (!this._currentSourceFile) {
            return;
        }
        const blockParent = node.parent;
        if (!blockParent) {
            console.warn('blockParent is undefined, sourceFile:', this._currentSourceFile.fileName);
            return;
        }

        const text = node.getText();
        const thisDotCount = (text.match(/this\./g) || []).length;
        if (thisDotCount > this._options.warnThisDotThreshold) {
            const sourceFileName = this._currentSourceFile.fileName;
            if (sourceFileName.includes('node_modules')) {
                return;
            }

            if (blockParent && ts.isMethodDeclaration(blockParent) || ts.isFunctionDeclaration(blockParent) || ts.isGetAccessor(blockParent) || ts.isSetAccessor(blockParent) || ts.isArrowFunction(blockParent)) {
                const parentName = blockParent.name?.getText();
                console.warn(`[OPTIMIZE ME] Found ${thisDotCount} 'this.' in block: ${parentName}, sourceFile: ${sourceFileName}`);
            }
        }
    }
}

export function warningPrinterTransformer(program: ts.Program, config?: Partial<IWarningPrinterOptions>): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        const minifier = new WarningPrinter(context, config);
        return (file: ts.SourceFile) => {
            return minifier.visitSourceFile(file, program, context);
        };
    };
}
