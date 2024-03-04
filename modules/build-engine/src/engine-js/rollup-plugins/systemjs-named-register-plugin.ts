import { babel as Transformer } from '@ccbuild/transformer';
import babel = Transformer.core;

import { rollup as Bundler } from '@ccbuild/bundler';
import rollup = Bundler.core;

interface Options {
    name: string;
}

function toNamedRegister(
    { types }: typeof babel,
    options: Options,
): babel.PluginObj {
    if (!options || !options.name) {
        throw new Error('\'name\' options is required.');
    }

    return {
        visitor: {
            CallExpression: (path): void => {
                if (types.isMemberExpression(path.node.callee) &&
                    types.isIdentifier(path.node.callee.object) && path.node.callee.object.name === 'System' &&
                    types.isIdentifier(path.node.callee.property) && path.node.callee.property.name === 'register' &&
                    path.node.arguments.length === 2) {
                    // Change `System.register([], function (exports, module) {});` to 
                    // `System.register('my_chunk_name', [], function (exports, module) {});`
                    path.node.arguments.unshift(types.stringLiteral(options.name));
                }
            },
        },
    };
}

function getChunkUrl(chunk: rollup.RenderedChunk): string {
    return `cocos-js/${chunk.fileName}`;
}

type RenderChunkResult = { code: string; map?: rollup.SourceMapInput } | string | null | undefined;

export function rpNamedChunk(): rollup.Plugin {
    return {
        name: 'named-chunk',
        renderChunk: async function(this, code, chunk, options): Promise<RenderChunkResult> {

            const chunkId = getChunkUrl(chunk);
            // Input format: System.register([], function(){...});
            // Output format: transformResult.code 为 System.register('chunk_id', [], function(){...});
            const transformResult = await babel.transformAsync(code, {
                sourceMaps: true,
                compact: false,
                plugins: [[toNamedRegister, { name: chunkId }]],
            });
            if (!transformResult) {
                this.warn('Failed to render chunk.');
                return null;
            }
            return {
                code: transformResult.code!,
                map: transformResult.map,
            };
        },
    };
}
