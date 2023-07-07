export interface ITsEnginePlugin {
    /**
     * The hook to resolve id, return `null` if this plugin cannot handle this script.
     * @param id 
     * @param importer 
     */
    resolve? (id: string, importer?: string): string | void;
    /**
     * The hook to load script, return `null` if this plugin cannot handle this script.
     * @param id 
     */
    load? (id: string): string | void;

    /**
     * The hook to transform id, return the absolute file path or null.
     * This is useful when we transform a virtual module id to an absolute file path.
     * eg. transform `internal:constants` to `filePath/__virtual__/internal_constants.ts`
     * @param id 
     */
    transformId? (id: string, importer?: string): string | void;
}