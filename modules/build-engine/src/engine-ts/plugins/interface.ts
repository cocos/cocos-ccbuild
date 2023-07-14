export interface ITsEnginePlugin {
    buildStart? (): Promise<void>;
    /**
     * The hook to resolve id, return `null` if this plugin cannot handle this script.
     * @param source 
     * @param importer 
     */
    resolve? (source: string, importer?: string): Promise<string | void>;
    /**
     * The hook to load script, return `null` if this plugin cannot handle this script.
     * @param id 
     */
    load? (id: string): Promise<string | void>;

    /**
     * The hook to transform id, return the absolute file path or null.
     * This is useful when we transform a virtual module id to an absolute file path.
     * eg. transform `internal:constants` to `filePath/__virtual__/internal_constants.ts`
     * @param source 
     */
    transformId? (source: string, importer?: string): string | void;
    buildEnd? (): Promise<void>;
}