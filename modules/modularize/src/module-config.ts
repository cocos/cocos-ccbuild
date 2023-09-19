// NOTE: This is the source code to generate module-config.schema.json

import { MinigamePlatform, NativePlatform, WebPlatform } from './platform-config';

export type MinigamePlatformConfig = {
    [key in Lowercase<keyof typeof MinigamePlatform>]?: string;
};
export type NativePlatformConfig = {
    [key in Lowercase<keyof typeof NativePlatform>]?: string;
};
export type WebPlatformConfig = {
    [key in Lowercase<keyof typeof WebPlatform>]?: string;
};

// keep compatibility for 'HTML5' and 'NATIVE'
export type PlatformType = Uppercase<keyof typeof WebPlatform | keyof typeof MinigamePlatform | keyof typeof NativePlatform> | 'HTML5' | 'NATIVE';

/**
 * Abstract platform export, like `web`, `native` and `minigame`.
 * Usually this is used for PAL modules.
 * The build tools resolve the relative platform as entry according to the build platform config.
 * - The value can be a `string` or a `object` which requires a default item.
 * eg. { "web": "/path/to/index.ts" } is equals to { "web": { default: "/path/to/index.ts" } }.
 * - We can also specify the exact platform like
 * { "web": {default: "/path/to/index.ts", "web-desktop": "/path/to/index.ts" } }.
 */
type AbstractPlatformExport<T> = ({
    /**
     * Default platform export for unspecified platforms.
     */
    default: string;
} & T) | string;

/**
 * The export condition. `types` fields are required.
 */
type ExportCondition<T> = {
    /**
     * This is the main module export condition.
     * - The dts bundle tools resolve this condition as entry.
     * - The API doc tools resolve this condition as entry.
     * - If no platform export is specified, the build tools resolve this condition as entry.
     */
    types: string;
    /**
     * The custom condition, for example:
     * - For gfx module: {"webgl1": "/path/to/webgl1/index.ts", "webgl2": "/path/to/webgl2/index.ts"}
     * - For physics module {"cannon": "/path/to/cannon/index.ts", "physX": "/path/to/physX/index.ts"}
     */
    [customCondition: string]: string;
} & T;

interface ConditionalExports {
    /**
     * This is exported to the game runtime.
     * Also we build the `cc.d.ts` with this export condition's `types` field.
     * `node` field is required to resolve the path of package.json for build tools.
     */
    '.': ExportCondition<{
        minigame?: AbstractPlatformExport<MinigamePlatformConfig>;
        native?: AbstractPlatformExport<NativePlatformConfig>;
        web?: AbstractPlatformExport<WebPlatformConfig>;
    }>,
    /**
     * This is exported to the engine internal.
     * It useful when we need to export some friend interfaces for internal engine modules.
     */
    './internal'?: ExportCondition<{
        minigame?: AbstractPlatformExport<MinigamePlatformConfig>;
        native?: AbstractPlatformExport<NativePlatformConfig>;
        web?: AbstractPlatformExport<WebPlatformConfig>;
    }>,
    /**
     * This is exported to the editor, which is useful when we need to export some editor only interfaces.
     * Also we build `cc.editor.d.ts` from this export condition's `types` field.
     * If this is not specified, we use the '.' export condition by default for module editor export,
     * otherwise, the build tools merges '.' and './editor' exports together for editor runtime environment.
     * It is different with `web_editor` or `native_editor` platform export:
     * - this condition exports some editor specific interfaces which is not cross-platform.
     * - the `web_editor` or `native_editor` platform export is an editor version of implementation of interfaces defined in `types` field which should be cross-platform.
     */
    './editor'?: ExportCondition<{}>,

    /**
     * This export provide a the path of javascript module which exports some method to query the info of module.
     */
    './query'?: string,
}

interface Migration {
    /**
     * The module version we migrate from.
     * Specially, version 0.0.0 means migrate from cc.config.json
     */
    from: string;
    /**
     * The module version we migrate to.
     */
    to: string;
    /**
     * The script to migrate, this script should export a method `function migrate (oldConfig): void`.
     */
    script: string;
}

interface ModuleOverride {
    /**
     * The test string to evaluate.
     */
    test: string;
    /**
     * The override config, override mapping from key to value.
     */
    overrides: Record<string, string>;
}

export interface ModuleConfig {
    [key: string]: unknown;
    /**
     * The module name.
     */
    name: string;
    /**
     * The version of module.
     * It is useful when we change the module config, then we need to make some migration.
     * This usually comes with the `cc.migrations` field.
     */
    version: string;
    /**
     * The config for conditional exports.
     */
    exports?: ConditionalExports;
    /**
     * Specify the module dependencies is required if this module import another one.
     * We need this field to generate the module dependency graph.
     */
    dependencies?: Record<string, string>;
    /**
     * Specify the dev dependencies, these dependencies are always used in `scripts` folder.
     */
    devDependencies?: Record<string, string>;
    /**
     * The dependencies between modules form a tree-structured dependency graph.
     * The correct dependency relationship should be that the upper module depends on the lower module one-way, and the reverse is wrong.
     * However, it is normal for modules at the same layer to depend on each other, and such dependencies should be declared as `peerDependencies`.
     * Otherwise the Turbo pipeline will report an error due to module circular dependencies.
     * see: https://github.com/vercel/turbo/issues/1480
     */
    peerDependencies?: Record<string, string>;
    /**
     * This is a CC-specific item difference from the node package.json standard specification.
     */
    cc?: {
        /**
         * The module asset dependencies, which is an array of asset uuid.
         */
        assetDependencies?: string[];
        /**
         * This is different with conditional exports.
         * Sometimes we just want to override a script file instead of the whole module.
         * Module override could support to do this job.
         * - eg. { "test": "context.mode === 'BUILD'", "overrides": { "/path/to/dev.ts": "/path/to/build.ts" } }
         */
        moduleOverrides?: ModuleOverride[];
        // /**
        //  * Anytime we introduce breaking changes, the migration should be done here.
        //  * The breaking changes include:
        //  * - Module removed.
        //  * - Module A and B is merged into Module C.
        //  * - Module A is separated into Module B and C. 
        //  * - Module is renamed.
        //  * - Module deps changed.
        //  * - Module config schema changed.
        //  * - And so on ...
        //  */
        // migrations?: Migration[];
        // editor: any;  // TODO: design editor schema
    };
}