import * as ts from '@mycocos/typescript';

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

export interface IManglePropertiesOptions {
	/**
	 * Prefix of generated names (e.g. '_ccprivate$')
	 */
	prefix: string;
    mangleList: string[];
    dontMangleList: string[];
}

const defaultOptions: IManglePropertiesOptions = {
    prefix: '_ccprivate$',
    mangleList: [],
    dontMangleList: [],
};

type NodeCreator<T extends ts.Node> = (newName: string) => T;
type AccessExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression;
type ClassMember = ts.MethodDeclaration | ts.PropertyDeclaration;
type InterfaceMember = ts.MethodSignature | ts.PropertySignature;

export class PropertiesMinifier {
    private readonly _context: ts.TransformationContext;
    private readonly _options: IManglePropertiesOptions;
    private _currentProgram!: ts.Program;
    private _typeChecker!: ts.TypeChecker;

    public constructor(context: ts.TransformationContext, options?: Partial<IManglePropertiesOptions>) {
        this._context = context;
        this._options = { ...defaultOptions, ...options };
    }

    public visitSourceFile(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile {
        this._currentProgram = program;
        this._typeChecker = program.getTypeChecker();
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
        if (this.isAccessExpression(node)) {
            return this.createNewAccessExpression(node, program);
        } else if (ts.isBindingElement(node)) {
            return this.createNewBindingElement(node, program);
        } else if (this.isConstructorParameterReference(node, program) || this.isIdentifierInVariableDeclaration(node, program)) {
            return this.createNewNode(program, node, this._context.factory.createIdentifier);
        }

        return node;
    }

    private createNewAccessExpression(node: AccessExpression, program: ts.Program): AccessExpression {
        const typeChecker = program.getTypeChecker();
        const accessName = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
        const symbol = typeChecker.getSymbolAtLocation(accessName);

        if (!this.isPrivateNonStaticClassMember(symbol)) {
            return node;
        }

        let propName: ts.PropertyName;
        let creator: NodeCreator<AccessExpression>;

        if (ts.isPropertyAccessExpression(node)) {
            propName = node.name;
            creator = (newName: string): AccessExpression => {
                return this._context.factory.createPropertyAccessExpression(node.expression, newName);
            };
        } else {
            if (!ts.isStringLiteral(node.argumentExpression)) {
                return node;
            }

            propName = node.argumentExpression;
            creator = (newName: string): AccessExpression => {
                return this._context.factory.createElementAccessExpression(node.expression, this._context.factory.createStringLiteral(newName));
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
        return this.isPrivate(node, parentSymbol) && !this.hasModifier(node, ts.SyntaxKind.StaticKeyword);
    }

    private isMangledInJsDoc(jsDocNode: JSDocContainer): boolean {
        if (jsDocNode.jsDoc) {
            for (const jsDoc of jsDocNode.jsDoc) {
                if (jsDoc.tags) {
                    for (const tag of jsDoc.tags) {
                        const tagName = tag.tagName.escapedText;
                        if (tagName === 'mangle') {
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
    
        if (!isPrivate) {
            isPrivate = this.isMangledInJsDoc(node as JSDocContainer);
        }
    
        const parentName = (node.parent as any).name?.escapedText;
        if (!parentName) return isPrivate;

        const name = node.name.getText();

        const isParentSymbolPrivate = parentSymbol && this.isParentSymbolPrivate(parentSymbol, name);
        if (isParentSymbolPrivate !== undefined) {
            // Ignore current private description and use parent's one
            isPrivate = isParentSymbolPrivate;
        } else {
            const propertyFullName = parentName + '.' + node.name.getText();
            // Check the mangleList option
            if (!isPrivate) {
                if (this._options.mangleList.includes(propertyFullName)) {
                    isPrivate = true;
                }
            }
        
            // Check the dontMangleList option
            if (isPrivate) {
                if (this._options.dontMangleList.includes(propertyFullName)) {
                    isPrivate = false;
                }
            }
        }
        
        return isPrivate;
    }

    private isParentSymbolPrivate(node: ts.Symbol, name: string): boolean | undefined {
        const valueDecl = node.valueDeclaration;
        if (valueDecl) {
            if (ts.isClassDeclaration(valueDecl)) {
                for (const heritageClause of valueDecl.heritageClauses || []) {
                    for (const type of heritageClause.types) {
                        const symbol = this._typeChecker.getSymbolAtLocation(type.expression);
                        if (symbol) {
                            const type = this._typeChecker.getDeclaredTypeOfSymbol(symbol);
                            const members = type.getProperties();
                            for (const member of members) {
                                if (member.name === name) {
                                    return this.isPrivateNonStaticClassMember(member);
                                }
                            }
                        }
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
        return ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node);
    }
    
    private isInterfaceMember(node: ts.Node): node is InterfaceMember {
        return ts.isMethodSignature(node) || ts.isPropertySignature(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node);
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

    private isIdentifierInVariableDeclaration(node: ts.Node, program: ts.Program): node is ts.Identifier {
        if (!ts.isIdentifier(node)) {
            return false;
        }
        
        const parent = node.parent;

        if (parent && (ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isGetAccessor(parent) || ts.isSetAccessor(parent))) {
            const variableDeclaration = parent.parent?.parent;
            if (variableDeclaration && ts.isVariableDeclaration(variableDeclaration)) {
                const checker = program.getTypeChecker();
                const parentName = parent.name.getText();
                const propertyName = node.text;
                const mangleKey = parentName + '.' + propertyName;
                if (this._options.mangleList.includes(mangleKey)) {
                    return true;
                }
                if (this._options.dontMangleList.includes(mangleKey)) {
                    return false;
                }

                const type = checker.getTypeAtLocation(variableDeclaration);
                for (const prop of type.getProperties()) {
                    if (!prop.valueDeclaration) continue;
                    for (const child of prop.valueDeclaration.getChildren()) {
                        const symbol = checker.getSymbolAtLocation(child);
                        if (symbol && symbol.escapedName === propertyName) {
                            for (const tag of symbol.getJsDocTags(checker)) {
                                if (tag.name === 'mangle') {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
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

        return symbol.declarations.some((x: ts.Declaration) => {
            // terser / uglify property minifiers aren't able to handle decorators
            return ((this.isClassMember(x) || this.isInterfaceMember(x) || this.isPropertyAssignment(x)) && !this.hasDecorators(x) || this.isConstructorParameter(x)) && this.isPrivateNonStatic(x, parentSymbol);
        });
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


