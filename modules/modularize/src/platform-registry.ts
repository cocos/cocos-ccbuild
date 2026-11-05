import * as path from 'path';
import { AsyncLocalStorage } from 'async_hooks';
import { MinigamePlatform, NativePlatform, WebPlatform } from './platform-config';

/** Serializable extension contract. Register before creating queries; restart to change definitions. */
export interface PlatformDefinition {
    id: string;
    category: 'web' | 'minigame' | 'native';
    /** Runtime-based games still resolve PAL minigame exports, but use RUNTIME_BASED constants. */
    runtimeMode?: 'web' | 'minigame' | 'runtime' | 'native';
    /** Virtual PAL specifier -> engine-relative implementation. */
    moduleOverrides?: Record<string, string>;
}
const definitions = new Map<string, PlatformDefinition>();
const scope = new AsyncLocalStorage<readonly PlatformDefinition[]>();
export function validatePlatformDefinitions(values: readonly PlatformDefinition[]): PlatformDefinition[] {
    if (!Array.isArray(values)) { throw new Error('platformDefinitions must be an array'); }
    const result = new Map<string, PlatformDefinition>();
    for (const value of values) {
        if (!value || !/^[A-Z][A-Z0-9_]*$/.test(value.id) || !['web', 'minigame', 'native'].includes(value.category)) {
            throw new Error('Invalid platform definition');
        }
        if (value.id in WebPlatform || value.id in NativePlatform || value.id in MinigamePlatform
            || ['HTML5', 'NATIVE', 'MINIGAME', 'NODEJS', 'INVALID_PLATFORM', 'BUILD', 'EDITOR', 'PREVIEW', 'TEST'].includes(value.id)) {
            throw new Error('Cannot redefine built-in platform: ' + value.id);
        }
        const runtimeMode = value.runtimeMode || value.category;
        if (!(value.category === 'minigame' ? ['minigame', 'runtime'] : [value.category]).includes(runtimeMode)) {
            throw new Error('Invalid runtimeMode for ' + value.id);
        }
        const moduleOverrides: Record<string, string> = {};
        if (value.moduleOverrides !== undefined && (!value.moduleOverrides || typeof value.moduleOverrides !== 'object' || Array.isArray(value.moduleOverrides))) {
            throw new Error('Invalid moduleOverrides');
        }
        for (const [source, target] of Object.entries(value.moduleOverrides || {}).sort(([a], [b]) => a.localeCompare(b))) {
            if (!/^pal\/[a-zA-Z0-9_/-]+$/.test(source) || typeof target !== 'string' || !target
                || path.isAbsolute(target) || path.win32.isAbsolute(target) || target.split(/[\\/]/).includes('..') || target.includes('{{')) {
                throw new Error('Invalid PAL override: ' + source);
            }
            moduleOverrides[source] = target.replace(/\\/g, '/');
        }
        const normalized: PlatformDefinition = { id: value.id, category: value.category };
        if (runtimeMode !== value.category) { normalized.runtimeMode = runtimeMode; }
        if (Object.keys(moduleOverrides).length) { normalized.moduleOverrides = moduleOverrides; }
        const previous = result.get(value.id);
        if (previous && JSON.stringify(previous) !== JSON.stringify(normalized)) { throw new Error('Conflicting platform: ' + value.id); }
        result.set(value.id, normalized);
    }
    return [...result.values()];
}
export function registerPlatformDefinitions(values: readonly PlatformDefinition[]): void {
    const merged = validatePlatformDefinitions([...definitions.values(), ...values]);
    definitions.clear();
    for (const definition of merged) { definitions.set(definition.id, Object.freeze(definition)); }
}
export function getPlatformDefinitions(): PlatformDefinition[] {
    return (scope.getStore() || [...definitions.values()]).map((item) => ({ ...item, ...(item.moduleOverrides ? { moduleOverrides: { ...item.moduleOverrides } } : {}) }));
}
export function withPlatformDefinitions<T>(values: readonly PlatformDefinition[], action: () => T): T {
    return scope.run(validatePlatformDefinitions(values), action);
}
export function getPlatformCategory(id: string): PlatformDefinition['category'] | undefined {
    return getPlatformDefinitions().find((item) => item.id === id.toUpperCase())?.category;
}

/** Feature level consumed by platform plugin hosts. */
export const platformRegistryVersion = 2;

export interface PlatformConstant {
    comment: string;
    type: 'boolean' | 'number';
    value: boolean | number | string;
    internal: boolean;
    ccGlobal?: boolean;
    dynamic?: boolean;
}
/** Shared by source builds and versioned package backports. Mutates a freshly parsed config only. */
export function extendPlatformConstants(config: Record<string, PlatformConstant>, values = getPlatformDefinitions()): void {
    for (const definition of values) {
        if (Object.prototype.hasOwnProperty.call(config, definition.id)) { throw new Error('Platform constant already exists: ' + definition.id); }
        config[definition.id] = { comment: 'Custom platform ' + definition.id, type: 'boolean', value: false, internal: false };
    }
    for (const [mode, constant] of [['web', 'HTML5'], ['minigame', 'MINIGAME'], ['runtime', 'RUNTIME_BASED'], ['native', 'NATIVE']]) {
        const ids = values.filter((item) => (item.runtimeMode || item.category) === mode).map((item) => '$' + item.id);
        if (ids.length) {
            const previous = config[constant];
            config[constant] = { ...(previous || { comment: mode, type: 'boolean', internal: false }),
                value: '(' + String(previous ? previous.value : false) + ') || ' + ids.join(' || ') };
        }
    }
}
export function getPlatformModuleOverrides(engine: string, platform: string | undefined, values = getPlatformDefinitions()): Record<string, string> {
    const result: Record<string, string> = {};
    const definition = values.find((item) => item.id === platform);
    for (const [source, target] of Object.entries(definition?.moduleOverrides || {})) { result[source] = path.resolve(engine, target); }
    return result;
}
