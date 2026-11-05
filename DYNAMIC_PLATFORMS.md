# Dynamic platforms

Definitions are serializable objects: `{ id: 'MY_MINIGAME', category: 'minigame' }`.
IDs are uppercase identifiers; categories are web, minigame and native. Built-in IDs cannot be replaced.

Pass `platformDefinitions` in `buildEngine` options to scope definitions to that build. AsyncLocalStorage isolates concurrent builds. ModuleQuery and ConstantManager snapshot definitions when created.

For standalone queries use `Modularize.withPlatformDefinitions(definitions, async () => { /* create queries here */ })`. Long-lived editor processes may call `Modularize.registerPlatformDefinitions(definitions)` before creating queries. Conflicting definitions are rejected atomically; restart to change definitions. Cross-process callers must serialize them explicitly.

The selected platform macro is true, other custom macros are false, and the corresponding HTML5/MINIGAME/NATIVE expression includes the new platforms. Declaration generation includes custom IDs. Existing engine constants cannot be overwritten. ModuleQuery selects the lower-case ID in PAL conditional exports, then the category default; explicit custom export conditions retain priority.

Registration does not implement SDK integration, PAL code or special compiler behavior such as OPEN_HARMONY preserveType handling.

## Verification

- `node scripts/test-platform-registry.cjs`
- `node scripts/test-platform-registry.cjs <editor checkout>` also tests editor JSON registration using installed editor dependencies.
- Set `CCBUILD_TEST_ENGINE=1` to additionally compile the animation engine fixture.

Editor setup examples: cocos-editor/app/builtin/builder/docs/dynamic-platforms.md. Ship the compiled ccbuild package with the editor change. Editing this checkout does not upgrade the editor's installed dependency.

## Registry v2

runtimeMode separates PAL category from engine execution mode. A category=minigame definition with runtimeMode=runtime contributes to RUNTIME_BASED, not MINIGAME. Runtime mode is included in conflict checks and serialized build/cache options.

moduleOverrides maps virtual pal/* specifiers to engine-relative files. StatsQuery merges these after engine overrides; it snapshots the same definitions as ConstantManager and ModuleQuery. Paths cannot escape the engine via absolute paths or parent segments. This does not generate PAL implementations or runtime adapters.

The exported platformRegistryVersion is 2. extendPlatformConstants and getPlatformModuleOverrides are shared with versioned package backports to keep semantics consistent.
