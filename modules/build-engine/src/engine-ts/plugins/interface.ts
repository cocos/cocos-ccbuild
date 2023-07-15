export interface ITsEnginePlugin {
    buildStart? (): Promise<void>;
    /**
     * The hook to resolve id, return `null` if this plugin cannot handle this script.
     * This hook is to transform source to id, which is the exact file path we read from.
     * @param source 
     * @param importer 
     */
    resolve? (source: string, importer?: string): Promise<string | void>;
    /**
     * The hook to load script, return `null` if this plugin cannot handle this script.
     * This hook decide how we load the script content from the module id.
     * @param id 
     */
    load? (id: string): Promise<string | void>;

    /**
     * The hook to transform id, return the absolute file path or null.
     * This hook is to transform module source to an override module id, which is for the output module id.
     * This output module id would also affect the import relative path in the output module.
     * @param source 
     */
    transformId? (source: string, importer?: string): string | void;
    buildEnd? (): Promise<void>;
}