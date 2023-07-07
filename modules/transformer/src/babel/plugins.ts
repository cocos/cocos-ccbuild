// @ts-expect-error no type
import syntaxTS from '@babel/plugin-syntax-typescript';
// @ts-expect-error no type
import syntaxDecorators from '@babel/plugin-syntax-decorators';
// @ts-expect-error no type
import transformForOf from '@babel/plugin-transform-for-of';
import cocosDynamicImportVars from '@cocos/babel-plugin-dynamic-import-vars';
// @ts-expect-error no type
import transformModulesSystemjs from '@babel/plugin-transform-modules-systemjs';

export {
    syntaxTS,
    syntaxDecorators,
    transformForOf,
    cocosDynamicImportVars,
    transformModulesSystemjs,
};