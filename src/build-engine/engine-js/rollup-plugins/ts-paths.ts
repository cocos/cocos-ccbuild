
import * as rollup from 'rollup';
import ts from 'typescript';
import fs from 'fs-extra';
import ps from 'path';

const RESOLVE_EXTENSIONS = ['.ts', '.js', '.json'];

function completeExtension (file: string): string | null {
    if (ps.extname(file)) {
        return fs.existsSync(file) ? file : null;
    }
    for (const extension of RESOLVE_EXTENSIONS) {
        const fileWithExtension = `${file}${extension}`;
        if (fs.existsSync(fileWithExtension)) {
            return fileWithExtension;
        }
        const indexWithExtension = ps.join(file, `index${extension}`);
        if (fs.existsSync(indexWithExtension)) {
            return indexWithExtension;
        }
    }
    return null;
}

export default function ({
    configFileName,
}: {
    configFileName: string;
}): rollup.Plugin {
    const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(configFileName, {}, {
        onUnRecoverableConfigFileDiagnostic: () => {},
        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
        readDirectory: ts.sys.readDirectory,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
    });
    if (!parsedCommandLine) {
        throw new Error(`Failed to read tsconfig`);
    }
    const { baseUrl, paths } = parsedCommandLine.options;
    let resolveId: rollup.ResolveIdHook | undefined;
    if (paths) {
        const baseUrlNormalized = ps.resolve(configFileName, baseUrl ?? '.');
        const simpleMap: Record<string, string> = {};
        const wildcardMap: Array<{
            prefix: string;
            suffix: string;
            target: string;
        }> = [];
        for (const [key, mapped] of Object.entries(paths)) {
            const target = ps.resolve(baseUrlNormalized, mapped[0]);
            const wildcardIndex = key.indexOf('*');
            if (wildcardIndex < 0) {
                simpleMap[key] = target;
            } else {
                wildcardMap.push({
                    prefix: key.slice(0, wildcardIndex),
                    suffix: key.slice(wildcardIndex + 1),
                    target,
                });
            }
        }
        wildcardMap.sort((lhs, rhs) => rhs.prefix.length - lhs.prefix.length);
        resolveId = function (this, source, importer) {
            if (source in simpleMap) {
                return simpleMap[source];
            }
            for (const { prefix, suffix, target } of wildcardMap) {
                if (source.length < prefix.length + suffix.length
                    || !source.startsWith(prefix)
                    || !source.endsWith(suffix)) {
                    continue;
                }
                const captured = source.slice(prefix.length, source.length - suffix.length);
                return completeExtension(ps.normalize(target.replace('*', captured)));
            }
            return null;
        };
    }
    return {
        name: 'ts-paths',
        resolveId,
    };
}
