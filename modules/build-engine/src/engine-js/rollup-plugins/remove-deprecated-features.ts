import { rollup as Bundler } from '@ccbuild/bundler';
import semver from 'semver';
import ps from 'path';

import rollup = Bundler.core;

export default function removeDeprecatedFeatures (range?: string): rollup.Plugin {
    const versionRange = range ? new semver.Range(range) : undefined;
    return {
        name: '@cocos/ccbuild|remove-deprecated-features',

        load (this, id: string): string | null {
            if (!ps.isAbsolute(id)) {
                return null;
            }

            const stem = ps.basename(id, ps.extname(id));
            const match = /^deprecated(-)?(.*)/.exec(stem);
            if (!match) {
                return null;
            }

            const versionString = match[2];
            if (versionString.length !== 0) {
                const parsedVersion = semver.parse(versionString);
                if (!parsedVersion) {
                    console.debug(`${id} looks like a deprecated module, but it contains an invalid version.`);
                    return null;
                }

                if (versionRange && !semver.satisfies(parsedVersion, versionRange)) {
                    return null;
                }
            }

            console.debug(`Exclude deprecated module ${id}`);
            return `export {}`;
        },
    };
}