// This code was modified from https://github.com/timocov/ts-transformer-minify-privates

import * as ts from '@cocos/typescript';

// decorators and modifiers-related api added in ts 4.8
interface BreakingTypeScriptApi {
    canHaveDecorators(node: ts.Node): boolean;
    getDecorators(node: ts.Node): readonly ts.Decorator[] | undefined;
    canHaveModifiers(node: ts.Node): boolean;
    getModifiers(node: ts.Node): readonly ts.Modifier[] | undefined;
}

interface JSDoc extends ts.Node {
    readonly kind: ts.SyntaxKind.JSDoc;
    readonly parent: ts.HasJSDoc;
    readonly tags?: ts.NodeArray<ts.JSDocTag>;
    readonly comment?: string | ts.NodeArray<ts.JSDocComment>;
}
interface JSDocContainer {
    jsDoc?: JSDoc[]; // JSDoc that directly precedes this node
}

type SymbolWithParent = ts.Symbol & { parent?: ts.Symbol };

const MANGLE_JSDOC_TAG_NAME = 'mangle';
const DONT_MANGLE_JSDOC_TAG_NAME = 'dontmangle';

export interface IMinifierOptions {
    /**
     * Prefix of generated names (e.g. '_ccprivate$')
     */
    prefix: string;
    mangleList: string[];
    dontMangleList: string[];
    mangleGetterSetter: boolean;
    mangleProtected: boolean;
    ignoreJsDocTag: boolean;
}

const defaultOptions: IMinifierOptions = {
    prefix: '_ccprivate$',
    mangleList: [],
    dontMangleList: [],
    mangleGetterSetter: false,
    mangleProtected: false,
    ignoreJsDocTag: false,
};

type NodeCreator<T extends ts.Node> = (newName: string) => T;
type AccessExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression;
type ClassMember = ts.MethodDeclaration | ts.PropertyDeclaration;
type InterfaceMember = ts.MethodSignature | ts.PropertySignature;
type PropertyInInterface = ts.PropertyAssignment | ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration;

export class PropertiesMinifier {
    private readonly _context: ts.TransformationContext;
    private readonly _options: IMinifierOptions;
    private _currentProgram: ts.Program | null = null;
    private _currentSourceFile: ts.SourceFile | null = null;
    private _typeChecker!: ts.TypeChecker;

    public constructor(context: ts.TransformationContext, options?: Partial<IMinifierOptions>) {
        this._context = context;
        this._options = { ...defaultOptions, ...options };
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
        if (this.isAccessExpression(node)) {
            return this.createNewAccessExpression(node, program);
        } else if (ts.isBindingElement(node)) {
            return this.createNewBindingElement(node, program);
        } else if (this.isConstructorParameterReference(node, program)) {
            return this.createNewNode(program, node, this._context.factory.createIdentifier);
        } else if (this.isPropertyInInterfaceNotShorthand(node.parent) && (
            this.isIdentifierInVariableDeclaration(node, program) ||
            this.isIdentifierInBinaryExpression(node, program) ||
            this.isIdentifierInArrayLiteralExpression(node, program))
        ) {
            return this.createNewNode(program, node, this._context.factory.createIdentifier);
        } else if (ts.isShorthandPropertyAssignment(node)) {
            if (this.isIdentifierInVariableDeclaration(node.name, program) ||
                this.isIdentifierInBinaryExpression(node.name, program) ||
                this.isIdentifierInArrayLiteralExpression(node.name, program)
            ) {
                return ts.factory.createPropertyAssignment(
                    this.createNewNode(program, node.name, this._context.factory.createIdentifier),
                    ts.factory.createIdentifier(node.name.text)
                );
            }
        }
        return node;
    }

    private createNewAccessExpression(node: AccessExpression, program: ts.Program): AccessExpression {
        const typeChecker = program.getTypeChecker();
        const accessName = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
        const symbol = typeChecker.getSymbolAtLocation(accessName);

        // FIXME: Currently, we don't support the ElementAccessExpression like this._prop?.['subprop'].
        if (symbol === undefined && ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
            const questionTokenNode = node.getChildAt(1);
            if (questionTokenNode && questionTokenNode.kind === ts.SyntaxKind.QuestionDotToken) {
                console.warn(`The ElementAccessExpression with question token ( ${node.getText()} ) is not supported.`);
            }
        }

        if (!this.isPrivateNonStaticClassMember(symbol)) {
            return node;
        }

        const hasQuestionToken = !!node.questionDotToken;

        let propName: ts.PropertyName;
        let creator: NodeCreator<AccessExpression>;

        if (ts.isPropertyAccessExpression(node)) {
            propName = node.name;
            creator = (newName: string): AccessExpression => {
                return hasQuestionToken ? 
                    this._context.factory.createPropertyAccessChain(node.expression, this._context.factory.createToken(ts.SyntaxKind.QuestionDotToken), newName) : 
                    this._context.factory.createPropertyAccessExpression(node.expression, newName);
            };
        } else {
            if (!ts.isStringLiteral(node.argumentExpression)) {
                return node;
            }

            propName = node.argumentExpression;
            creator = (newName: string): AccessExpression => {
                return hasQuestionToken ? 
                    this._context.factory.createElementAccessChain(node.expression, this._context.factory.createToken(ts.SyntaxKind.QuestionDotToken), this._context.factory.createStringLiteral(newName)) :
                    this._context.factory.createElementAccessExpression(node.expression, this._context.factory.createStringLiteral(newName));
            };
        }

        return this.createNewNode(program, propName, creator);
    }

    private createNewBindingElement(node: ts.BindingElement, program: ts.Program): ts.BindingElement {
        const typeChecker = program.getTypeChecker();

        let propName: ts.PropertyName;
        let symbol: ts.Symbol | undefined;

        if (node.propertyName === undefined) {
            // if no property name is set (const { a } = foo)
            // then node.propertyName is undefined and we need to find this property by yourself
            // so let's use go-to-definition algorithm from TSServer
            // see https://github.com/microsoft/TypeScript/blob/672b0e3e16ad18b422dbe0cec5a98fce49881b76/src/services/goToDefinition.ts#L58-L77
            if (!ts.isObjectBindingPattern(node.parent as ts.Node)) {
                return node;
            }

            const type = typeChecker.getTypeAtLocation(node.parent as ts.Node);
            if (type.isUnion()) {
                return node;
            }

            if (!ts.isIdentifier(node.name)) {
                return node;
            }

            propName = node.name;
            symbol = type.getProperty(ts.idText(propName));
        } else {
            propName = node.propertyName;
            symbol = typeChecker.getSymbolAtLocation(node.propertyName);
        }

        if (!this.isPrivateNonStaticClassMember(symbol)) {
            return node;
        }

        return this.createNewNode(program, propName, (newName: string) => {
            return this._context.factory.createBindingElement(node.dotDotDotToken, newName, node.name, node.initializer);
        });
    }

    private createNewNode<T extends ts.Node>(program: ts.Program, oldProperty: ts.PropertyName, createNode: NodeCreator<T>): T {
        const typeChecker = program.getTypeChecker();
        const symbol = typeChecker.getSymbolAtLocation(oldProperty);
        if (symbol === undefined) {
            throw new Error(`Cannot get symbol for node "${oldProperty.getText()}"`);
        }

        const oldPropertyName = symbol.escapedName as string;

        const newPropertyName = this.getNewName(oldPropertyName);
        const newProperty = createNode(newPropertyName);

        return newProperty;
    }

    private getNewName(originalName: string): string {
        return `${this._options.prefix}${originalName}`;
    }

    private isPrivateNonStatic(node: ClassMember | ts.ParameterDeclaration | InterfaceMember | ts.PropertyAssignment, parentSymbol: ts.Symbol | undefined): boolean {
        return this.isPrivate(node, parentSymbol);// && !this.hasModifier(node, ts.SyntaxKind.StaticKeyword);
    }

    private hasJsDocTag(jsDocNode: JSDocContainer, tagNameToSearch: string): boolean {
        if (jsDocNode.jsDoc) {
            for (const jsDoc of jsDocNode.jsDoc) {
                if (jsDoc.tags) {
                    for (const tag of jsDoc.tags) {
                        const tagName = tag.tagName.escapedText;
                        if (tagName === tagNameToSearch) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private isPrivate(node: ClassMember | ts.ParameterDeclaration | InterfaceMember | ts.PropertyAssignment, parentSymbol: ts.Symbol | undefined): boolean {
        let isPrivate = this.hasModifier(node, ts.SyntaxKind.PrivateKeyword);
        if (!isPrivate && this._options.mangleProtected) {
            isPrivate = this.hasModifier(node, ts.SyntaxKind.ProtectedKeyword);
        }
        if (!this._options.ignoreJsDocTag) {
            if (!isPrivate && this.hasJsDocTag(node as JSDocContainer, MANGLE_JSDOC_TAG_NAME)) {
                isPrivate = true;
            }

            if (isPrivate && this.hasJsDocTag(node as JSDocContainer, DONT_MANGLE_JSDOC_TAG_NAME)) {
                isPrivate = false;
            }
        }

        const parentName = (node.parent as any).name?.escapedText;
        if (!parentName) return isPrivate;

        const name = node.name.getText();
        const isParentSymbolPrivate = parentSymbol && this.isParentSymbolPrivate(parentSymbol, name);
        if (isParentSymbolPrivate !== undefined) {
            // Ignore current private description and use parent's one
            isPrivate = isParentSymbolPrivate;
        } else {
            isPrivate = this.updatePrivateByOptions(isPrivate, parentName, name);
        }

        return isPrivate;
    }

    private updatePrivateByOptions(isPrivate: boolean, parentName: string | undefined, propertyName: string | undefined): boolean {
        if (parentName === undefined) return isPrivate;
        let fullName = parentName;
        if (propertyName) {
            fullName = fullName + '.' + propertyName;
        }
        // Check the mangleList option
        if (!isPrivate) {
            if (this._options.mangleList.includes(fullName) || this._options.mangleList.includes(parentName)) {
                isPrivate = true;
            }
        }

        // Check the dontMangleList option
        if (isPrivate) {
            if (this._options.dontMangleList.includes(fullName) || this._options.dontMangleList.includes(parentName)) {
                isPrivate = false;
            }
        }
        return isPrivate;
    }

    private isParentSymbolPrivate(parentSymbol: ts.Symbol, name: string): boolean | undefined {
        if (this._options.ignoreJsDocTag) {
            return undefined;
        }
        let valueDecl = parentSymbol.valueDeclaration;
        if (!valueDecl) {
            const decls = parentSymbol.declarations;
            if (decls) {
                valueDecl = decls[0];
            }
        }
        if (valueDecl) {
            if (ts.isClassDeclaration(valueDecl) || ts.isInterfaceDeclaration(valueDecl)) {
                if (valueDecl.heritageClauses) {
                    for (const heritageClause of valueDecl.heritageClauses) {
                        for (const type of heritageClause.types) {
                            const classOrInterfaceSymbol = this._typeChecker.getSymbolAtLocation(type.expression);
                            if (classOrInterfaceSymbol && parentSymbol !== classOrInterfaceSymbol) {
                                const classOrInterfaceType = this._typeChecker.getDeclaredTypeOfSymbol(classOrInterfaceSymbol);
                                const members = classOrInterfaceType.getProperties();
                                for (const member of members) {
                                    if (member.name === name) {
                                        const jsDocTags = classOrInterfaceSymbol.getJsDocTags(this._typeChecker);
                                        if (jsDocTags.some(tag => tag.name === MANGLE_JSDOC_TAG_NAME)) {
                                            return true;
                                        } else if (jsDocTags.some(tag => tag.name === DONT_MANGLE_JSDOC_TAG_NAME)) {
                                            return false;
                                        } else {
                                            return this.isPrivateNonStaticClassMember(member);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                let found: ts.Symbol | undefined;
                // Check wether the parent class or interface has @mangle tag
                if (parentSymbol.members) {
                    parentSymbol.members.forEach(member => {
                        if (member.name === name) {
                            found = member;
                        }
                    });
                }

                // exports stores static properties those don't exist in members.
                if (!found && parentSymbol.exports) {
                    parentSymbol.exports.forEach(export_ => {
                        if (export_.name === name) {
                            found = export_;
                        }
                    });
                }

                if (found) {
                    const parentJsDocTags = parentSymbol.getJsDocTags(this._typeChecker);
                    if (parentJsDocTags.some(tag => tag.name === MANGLE_JSDOC_TAG_NAME)) {
                        return true;
                    } else if (parentJsDocTags.some(tag => tag.name === DONT_MANGLE_JSDOC_TAG_NAME)) {
                        return false;
                    }
                }
            }
        }
        return undefined;
    }

    private hasModifier(node: ts.Node, modifier: ts.SyntaxKind): boolean {
        return this.getModifiers(node).some((mod: ts.Modifier) => mod.kind === modifier);
    }

    private isAccessExpression(node: ts.Node): node is AccessExpression {
        return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
    }

    private isClassMember(node: ts.Node): node is ClassMember {
        let ret = ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node);
        if (!ret && this._options.mangleGetterSetter) {
            ret = ts.isGetAccessor(node) || ts.isSetAccessor(node);
        }
        return ret;
    }

    private isInterfaceMember(node: ts.Node): node is InterfaceMember {
        let ret = ts.isMethodSignature(node) || ts.isPropertySignature(node);
        if (!ret && this._options.mangleGetterSetter) {
            ret = ts.isGetAccessor(node) || ts.isSetAccessor(node);
        }
        return ret;
    }

    private isConstructorParameter(node: ts.Node): node is ts.ParameterDeclaration {
        return ts.isParameter(node) && ts.isConstructorDeclaration(node.parent as ts.Node);
    }

    private isConstructorParameterReference(node: ts.Node, program: ts.Program): node is ts.Identifier {
        if (!ts.isIdentifier(node)) {
            return false;
        }

        const typeChecker = program.getTypeChecker();
        const symbol = typeChecker.getSymbolAtLocation(node) as SymbolWithParent;
        return this.isPrivateNonStaticClassMember(symbol);
    }

    private isPropertyInInterfaceNotShorthand(node: ts.Node): node is PropertyInInterface {
        if (!node) return false;
        let isPropertyInInterface = ts.isPropertyAssignment(node) || ts.isMethodDeclaration(node);
        if (!isPropertyInInterface && this._options.mangleGetterSetter) {
            isPropertyInInterface = ts.isGetAccessor(node) || ts.isSetAccessor(node);
        }
        return isPropertyInInterface;
    }

    private getTypeSymbol(interfaceType: ts.Type, propertyName: string): ts.Symbol | undefined {
        let typeSymbol: ts.Symbol | undefined;
        if (interfaceType.isUnion()) {
            for (const t of interfaceType.types) {
                if (!t.symbol || !t.symbol.members) continue;
                if (t.symbol.members.has(propertyName as ts.__String)) {
                    typeSymbol = t.symbol;
                    break;
                }
            }
        } else {
            typeSymbol = interfaceType.symbol;
        }
        return typeSymbol;
    }

    private isInterfacePropertyHasMangleTag(typeSymbol: ts.Symbol, propertyName: string): boolean {
        if (this._options.ignoreJsDocTag) {
            return false;
        }
        const checker = this._typeChecker;
        let isPrivate = false;
        // interface definition has @mangle tag
        if (typeSymbol.getJsDocTags(checker).some(tag => tag.name === MANGLE_JSDOC_TAG_NAME)) {
            isPrivate = true;
        } else {
            if (typeSymbol.getJsDocTags(checker).some(tag => tag.name === MANGLE_JSDOC_TAG_NAME)) {
                isPrivate = true;
            } else {
                if (typeSymbol.members) {
                    const members = typeSymbol.members.values();
                    let result = members.next();
                    while (!result.done) {
                        const member = result.value;
                        if (member && member.valueDeclaration) {
                            for (const child of member.valueDeclaration.getChildren()) {
                                const symbol = checker.getSymbolAtLocation(child);
                                if (symbol && symbol.escapedName === propertyName) {
                                    for (const tag of symbol.getJsDocTags(checker)) {
                                        if (tag.name === MANGLE_JSDOC_TAG_NAME) {
                                            isPrivate = true;
                                            break;
                                        }
                                    }
                                }

                                if (isPrivate) {
                                    break;
                                }
                            }

                            if (isPrivate) {
                                break;
                            }
                        }
                        result = members.next();
                    }
                }
            }
        }
        return isPrivate;
    }

    private isIdentifierInVariableDeclaration(node: ts.Node, program: ts.Program): node is ts.Identifier {
        if (!ts.isIdentifier(node)) {
            return false;
        }

        const parent = node.parent as PropertyInInterface;
        if (!parent) {
            return false;
        }

        const prev3Node = parent.parent?.parent;
        if (!prev3Node) return false;

        if (ts.isVariableDeclaration(prev3Node)) {
            if (parent.name !== node) {
                return false;
            }

            const checker = program.getTypeChecker();
            const propertyName = node.text;
            const type = checker.getTypeAtLocation(prev3Node.name);
            const typeSymbol = this.getTypeSymbol(type, propertyName);
            if (!typeSymbol) {
                return false;
            }
            const isPrivate = this.isInterfacePropertyHasMangleTag(typeSymbol, propertyName);
            const parentName = typeSymbol.escapedName as string | undefined;
            return this.updatePrivateByOptions(isPrivate, parentName, propertyName);
        }

        return false;
    }

    private isIdentifierInArrayLiteralExpression(node: ts.Node, program: ts.Program): node is ts.Identifier {
        if (!ts.isIdentifier(node)) {
            return false;
        }

        const parent = node.parent as PropertyInInterface;
        if (!parent) {
            return false;
        }

        const prev3Node = parent.parent?.parent;
        if (!prev3Node) return false;

        if (ts.isArrayLiteralExpression(prev3Node)) {
            const checker = this._typeChecker;
            const contextualType = checker.getContextualType(prev3Node);

            if (!contextualType) {
                return false;
            }

            if (contextualType.symbol && contextualType.symbol.name === 'Array') {
                const typeArguments = checker.getTypeArguments(contextualType as ts.TypeReference);
                const elementType = typeArguments[0];
                const propertyName = node.text;
                const typeSymbol = this.getTypeSymbol(elementType, propertyName);
                if (!typeSymbol) {
                    return false;
                }
                const isPrivate = this.isInterfacePropertyHasMangleTag(typeSymbol, propertyName);
                const parentName = typeSymbol.escapedName as string | undefined;
                return this.updatePrivateByOptions(isPrivate, parentName, propertyName);
            }
        }

        return false;
    }

    private isIdentifierInBinaryExpression(node: ts.Node, program: ts.Program): node is ts.Identifier {
        if (!ts.isIdentifier(node)) {
            return false;
        }

        const parent = node.parent as PropertyInInterface;
        if (!parent) {
            return false;
        }

        const prev3Node = parent.parent?.parent;
        if (!prev3Node) return false;

        if (ts.isBinaryExpression(prev3Node)) {
            if (parent.name !== node) {
                return false;
            }

            const checker = program.getTypeChecker();
            const propertyName = node.text;
            const type = checker.getTypeAtLocation(prev3Node.left);
            const typeSymbol = this.getTypeSymbol(type, propertyName);
            if (!typeSymbol) {
                return false;
            }
            const isPrivate = this.isInterfacePropertyHasMangleTag(typeSymbol, propertyName);
            const parentName = typeSymbol.escapedName as string | undefined;
            return this.updatePrivateByOptions(isPrivate, parentName, propertyName);
        }
        return false;
    }

    private isPropertyAssignment(node: ts.Declaration): node is ts.PropertyAssignment {
        return ts.isPropertyAssignment(node);
    }

    private isPrivateNonStaticClassMember(symbol: SymbolWithParent | undefined): boolean {
        // for some reason ts.Symbol.declarations can be undefined (for example in order to accessing to proto member)
        if (symbol === undefined || symbol.declarations === undefined) {
            return false;
        }

        const parentSymbol = symbol.parent;
        const ret = symbol.declarations.some((x: ts.Declaration) => {
            // terser / uglify property minifiers aren't able to handle decorators
            return ((this.isClassMember(x) || this.isInterfaceMember(x) || this.isPropertyAssignment(x)) && !this.hasDecorators(x) || this.isConstructorParameter(x)) && this.isPrivateNonStatic(x, parentSymbol);
        });
        return ret;
    }

    private hasDecorators(node: ts.Node): boolean {
        if (this.isBreakingTypeScriptApi(ts)) {
            return ts.canHaveDecorators(node) && !!ts.getDecorators(node);
        }

        return !!node.decorators;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private getModifiers(node: ts.Node): readonly ts.Modifier[] {
        if (this.isBreakingTypeScriptApi(ts)) {
            if (!ts.canHaveModifiers(node)) {
                return [];
            }

            return ts.getModifiers(node) || [];
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return node.modifiers || [];
    }

    private isBreakingTypeScriptApi(compiler: unknown): compiler is BreakingTypeScriptApi {
        return 'canHaveDecorators' in ts;
    }
}

export function minifyPrivatePropertiesTransformer(program: ts.Program, config?: Partial<IMinifierOptions>): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        const minifier = new PropertiesMinifier(context, config);
        return (file: ts.SourceFile) => {
            return minifier.visitSourceFile(file, program, context);
        };
    };
}
