import * as ts from '@mycocos/typescript';

import { PropertiesMinifier, PropertyMinifierOptions } from './properties-minifier';

export function minifyPrivatesTransformer(program: ts.Program, config?: Partial<PropertyMinifierOptions>): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
        const minifier = new PropertiesMinifier(context, config);
        return (file: ts.SourceFile) => {
            return minifier.visitSourceFile(file, program, context);
        };
    };
}
