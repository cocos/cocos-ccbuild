// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../static/types-polyfill.d.ts"/>

import syntaxTS from '@babel/plugin-syntax-typescript';
import syntaxDecorators from '@babel/plugin-syntax-decorators';
import transformForOf from '@babel/plugin-transform-for-of';
import cocosDynamicImportVars from '@cocos/babel-plugin-dynamic-import-vars';
import transformModulesSystemjs from '@babel/plugin-transform-modules-systemjs';

export {
    syntaxTS,
    syntaxDecorators,
    transformForOf,
    cocosDynamicImportVars,
    transformModulesSystemjs,
};