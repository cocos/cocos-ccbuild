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

export interface IManglePropertiesOptions {
	/**
	 * Prefix of generated names (e.g. '_ccprivate_')
	 */
	prefix: string;
    mangleList: string[];
    dontMangleList: string[];
}

const defaultOptions: IManglePropertiesOptions = {
    prefix: '_ccprivate_',
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

    public constructor(context: ts.TransformationContext, options?: Partial<IManglePropertiesOptions>) {
        this._context = context;
        this._options = { ...defaultOptions, ...options };
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
        if (this.isAccessExpression(node)) {
            return this.createNewAccessExpression(node, program);
        } else if (ts.isBindingElement(node)) {
            return this.createNewBindingElement(node, program);
        } else if (this.isConstructorParameterReference(node, program)) {
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

    private isPrivateNonStatic(node: ClassMember | ts.ParameterDeclaration | InterfaceMember): boolean {
        return this.hasPrivateKeyword(node) && !this.hasModifier(node, ts.SyntaxKind.StaticKeyword);
    }
    
    private hasPrivateKeyword(node: ClassMember | ts.ParameterDeclaration | InterfaceMember): boolean {
        let isPrivate = this.hasModifier(node, ts.SyntaxKind.PrivateKeyword);
    
        if (!isPrivate) {
            const jsDocNode = node as JSDocContainer;
            if (jsDocNode.jsDoc) {
                for (const jsDoc of jsDocNode.jsDoc) {
                    if (jsDoc.tags) {
                        for (const tag of jsDoc.tags) {
                            const tagName = tag.tagName.escapedText;
                            if (tagName === 'mangle') {
                                isPrivate = true;
                                break;
                            }
                        }
                    }
                    if (isPrivate) {
                        break;
                    }
                }
            }
        }
    
        const parentName = (node.parent as any).name?.escapedText;
        if (!parentName) return isPrivate;
        
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
    
        return isPrivate;
    }
    
    private hasModifier(node: ts.Node, modifier: ts.SyntaxKind): boolean {
        return this.getModifiers(node).some((mod: ts.Modifier) => mod.kind === modifier);
    }
    
    private isAccessExpression(node: ts.Node): node is AccessExpression {
        return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
    }
    
    private isClassMember(node: ts.Node): node is ClassMember {
        return ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node);
    }
    
    private isInterfaceMember(node: ts.Node): node is InterfaceMember {
        return ts.isMethodSignature(node) || ts.isPropertySignature(node);
    }
    
    private isConstructorParameter(node: ts.Node): node is ts.ParameterDeclaration {
        return ts.isParameter(node) && ts.isConstructorDeclaration(node.parent as ts.Node);
    }
    
    private isConstructorParameterReference(node: ts.Node, program: ts.Program): node is ts.Identifier {
        if (!ts.isIdentifier(node)) {
            return false;
        }
    
        const typeChecker = program.getTypeChecker();
        const symbol = typeChecker.getSymbolAtLocation(node);
        return this.isPrivateNonStaticClassMember(symbol);
    }
    
    private isPrivateNonStaticClassMember(symbol: ts.Symbol | undefined): boolean {
        // for some reason ts.Symbol.declarations can be undefined (for example in order to accessing to proto member)
        if (symbol === undefined || symbol.declarations === undefined) {
            return false;
        }
    
        return symbol.declarations.some((x: ts.Declaration) => {
            // terser / uglify property minifiers aren't able to handle decorators
            return ((this.isClassMember(x) || this.isInterfaceMember(x)) && !this.hasDecorators(x) || this.isConstructorParameter(x)) && this.isPrivateNonStatic(x);
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


