// This code was modified from https://github.com/timocov/ts-transformer-minify-privates

import * as ts from '@cocos/typescript';
import { StatsQuery, ConfigInterface } from '@ccbuild/stats-query';

const EXPORT_CONTROL_JSDOC_TAG_NAME = 'export_if';

export interface IExportControllerOptions {
    statsQuery: StatsQuery;
    context: ConfigInterface.Context;
}

export class ExportController {
    private readonly _context: ts.TransformationContext;
    private _currentProgram: ts.Program | null = null;
    private _currentSourceFile: ts.SourceFile | null = null;
    private _typeChecker!: ts.TypeChecker;
    private _options: IExportControllerOptions;

    constructor(context: ts.TransformationContext, options: IExportControllerOptions) {
        this._context = context;
        this._options = { ...options };
    }

    public visitSourceFile(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile {
        this._currentProgram = program;
        this._currentSourceFile = node;
        this._typeChecker = program.getTypeChecker();
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

    private visitNode(node: ts.Node, program: ts.Program): ts.Node {
        if (node.kind === ts.SyntaxKind.ExportDeclaration || node.kind == ts.SyntaxKind.VariableStatement) {
            const jsDocTags = ts.getJSDocTags(node);
            for (const tag of jsDocTags) {
                if (tag.tagName.text === EXPORT_CONTROL_JSDOC_TAG_NAME && typeof tag.comment === 'string') {
                    const testResult = this._options.statsQuery.evalTest(tag.comment, this._options.context);
                    if (!testResult) {
                        return this._context.factory.createEmptyStatement(); // ; statement
                    }
                }
            }
        }
        return node;
    }
}

export function exportControllerTransformer(program: ts.Program, config: IExportControllerOptions): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        const controller = new ExportController(context, config);
        return (file: ts.SourceFile) => {
            return controller.visitSourceFile(file, program, context);
        };
    };
}
