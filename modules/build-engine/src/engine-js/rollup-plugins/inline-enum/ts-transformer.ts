import * as ts from '@mycocos/typescript';
import { EnumData } from './core/enum';

class EnumInliner {
    private readonly _context: ts.TransformationContext;
    private readonly _enumData: EnumData;

    public constructor(context: ts.TransformationContext, enumData: EnumData) {
        this._context = context;
        this._enumData = enumData;
    }

    public visitSourceFile(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile {
        const result = this.visitNodeAndChildren(node, program, context);
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
        if (isAccessExpression(node)) {
            return this.tryCreateLiteral(node, program);
        } else if (ts.isEnumDeclaration(node)) {
            return this.tryReplaceEnumDeclaration(node, program);
        }

        return node;
    }

    private tryReplaceEnumDeclaration(node: ts.EnumDeclaration, program: ts.Program): ts.Node {
        const enumName = node.name;
        const typeChecker = program.getTypeChecker();
        const symbol = typeChecker.getSymbolAtLocation(enumName);

        if (symbol && symbol.declarations && symbol.declarations.length > 0) {
            const declaration = symbol.declarations[0];
            if (ts.isEnumDeclaration(declaration)) {
                let foundAll = true;
                const members = declaration.members.map(member => {
                    const name = member.name.getText();
                    const fullName: string = `${enumName.getText()}.${name}`;
                    const value = this._enumData.defines[fullName as keyof EnumData['defines']];
                    if (value === undefined) {
                        foundAll = false;
                    }

                    return ts.factory.createPropertyAssignment(name, typeof value === 'number' ? ts.factory.createNumericLiteral(value) : ts.factory.createStringLiteral(value));
                });

                if (!foundAll) {
                    return node;
                }

                const enumObject = ts.factory.createObjectLiteralExpression(members, true);
                const exportModifiers = getModifier(node, ts.SyntaxKind.ExportKeyword) ? [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)] : undefined;
 
                return ts.factory.createVariableStatement(
                    exportModifiers,
                    ts.factory.createVariableDeclarationList(
                        [ts.factory.createVariableDeclaration(enumName, undefined, undefined, enumObject)],
                        ts.NodeFlags.Const
                    )
                );
            }
        }
        return node;
    }

    private tryCreateLiteral(node: AccessExpression, program: ts.Program): ts.LiteralExpression | ts.AccessExpression {
        const typeChecker = program.getTypeChecker();

        const accessName: ts.MemberName | ts.StringLiteral  = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression as ts.StringLiteral;
        const symbol = typeChecker.getSymbolAtLocation(accessName);

        if (node.parent && ts.isTemplateSpan(node.parent)) {
            return node;
        }

        if (symbol && symbol.valueDeclaration && symbol.valueDeclaration.kind === ts.SyntaxKind.EnumMember) {
            const enumText = node.expression.getText() + '.' + accessName.text;
            const enumInlinedValue = this._enumData.defines[enumText as keyof EnumData['defines']];
            if (typeof enumInlinedValue === 'number') {
                return this._context.factory.createNumericLiteral(enumInlinedValue);
            } else if (typeof enumInlinedValue === 'string') {
                return this._context.factory.createStringLiteral(enumInlinedValue);
            }
        }

        return node;
    }
}


type AccessExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression;

function isAccessExpression(node: ts.Node): node is AccessExpression {
    return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
}

function getModifier(node: ts.Node, modifier: ts.SyntaxKind): ts.Modifier | undefined {
    return getModifiers(node).find((mod: ts.Modifier) => mod.kind === modifier);
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function getModifiers(node: ts.Node): readonly ts.Modifier[] {
    if (isBreakingTypeScriptApi(ts)) {
        if (!ts.canHaveModifiers(node)) {
            return [];
        }

        return ts.getModifiers(node) || [];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return node.modifiers || [];
}

// decorators and modifiers-related api added in ts 4.8
interface BreakingTypeScriptApi {
    canHaveDecorators(node: ts.Node): boolean;
    getDecorators(node: ts.Node): readonly ts.Decorator[] | undefined;
    canHaveModifiers(node: ts.Node): boolean;
    getModifiers(node: ts.Node): readonly ts.Modifier[] | undefined;
}

function isBreakingTypeScriptApi(compiler: unknown): compiler is BreakingTypeScriptApi {
    return 'canHaveDecorators' in ts;
}

export function inlineEnumTransformer(program: ts.Program, enumData: EnumData): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        const inliner = new EnumInliner(context, enumData);
        return (file: ts.SourceFile) => {
            return inliner.visitSourceFile(file, program, context);
        };
    };
}
