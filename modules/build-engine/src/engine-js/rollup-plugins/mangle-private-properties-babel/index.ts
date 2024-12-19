import { rollup as Bundler } from '@ccbuild/bundler';
import rollup = Bundler.core;

import { babel } from '@ccbuild/transformer';

const t = babel.types;

export interface IManglePrivatePropertiesOptionsBabel {
    include?: string | string[];
}

/**
 * The main unplugin instance.
 */
export async function rpManglePrivatePropertiesBabel(rawOptions: IManglePrivatePropertiesOptionsBabel, meta?: any): Promise<rollup.Plugin[]> {
    const name = 'cc-mangle-private-properties-babel';

    return [
        {
            name,
            
            async resolveId (this, source, importer): Promise<string | { id: string; external: true; } | null> {
                return null;
            },

            transform(this, code: string, moduleId: string): rollup.TransformResult {
                const ast = babel.parser.parse(code, {
                    sourceType: 'module',
                    plugins: ['typescript', 'classProperties']
                });

                babel.traverse.default(ast, {
                    ClassProperty(path) {
                        if (path.node.accessibility === 'private') {
                            if (t.isIdentifier(path.node.key)) {
                                const privateName = path.node.key.name;
                                const mangledName = `${privateName}$`;
                                path.node.key.name = mangledName;
                            }
                        }
                    },
                    ClassMethod(path) {
                        if (path.node.accessibility === 'private') {
                            if (t.isIdentifier(path.node.key)) {
                                const privateName = path.node.key.name;
                                const mangledName = `${privateName}$`;
                                path.node.key.name = mangledName;
                            }
                        }
                    },
                    MemberExpression(path) {
                        if (t.isIdentifier(path.node.property)) {
                            const privateName = path.node.property.name;
                            const mangledName = `${privateName}$`;
                            path.node.property.name = mangledName;
                        }
                    }
                });

                const output = babel.generator.default(ast, {}, code);

                return {
                    code: output.code,
                    map: output.map
                };
            },
        },
    ];
}
