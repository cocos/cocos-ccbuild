import * as core from '@babel/core';
import * as parser from '@babel/parser';
import * as generator from '@babel/generator';
import * as traverse from '@babel/traverse';
import * as types from '@babel/types';
import * as presets from './presets';
import * as plugins from './plugins';
import * as helpers from './helper';

export {
    core,
    parser,
    generator,
    traverse,
    types,
    presets,
    plugins,
    helpers,
};