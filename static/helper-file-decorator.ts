
/**
 * TsPropertyDecorator cannot access the property descriptor, sometimes we need to access the initializer in property descriptor.
 * This helper helps receive the initializer from EngineCompiler, and generate a BabelPropertyDecorator in runtime.
 * @param decoratorOrFactory A TsPropertyDecorator or a decorator factory
 * @param initializer the property initializer generate from engine compiler
 * @param factoryArgs if `decoratorOrFactory` is a factory, then we may need some arguments for this factory method.
 * @returns BabelPropertyDecorator
 */
export function CCBuildTsFieldDecoratorHelper (decoratorOrFactory: Function, initializer: Function | null, ...factoryArgs: any[]): PropertyDecorator {
    if (factoryArgs.length > 0) {
        const decorator = decoratorOrFactory(...factoryArgs);
        return (target, propertyKey) => {
            decorator(target, propertyKey, initializer);
        };
    } else {
        return (target, propertyKey) => {
            decoratorOrFactory(target, propertyKey, initializer);
        };
    }
}