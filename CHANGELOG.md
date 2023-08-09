# Change Log - @cocos/ccbuild

## 2.0.3-alpha.5

### Patch Changes

- optimize: remove eslint deps on ts engine builder

## 2.0.3-alpha.4

### Patch Changes

- 673cb2d: fix: type error in CCBuildTsFieldDecoratorHelper

## 2.0.3-alpha.3

### Patch Changes

- fix: dts files copy in naitve/external

## 2.0.3-alpha.2

### Patch Changes

- a8463a2: fix: circular reference && type merge && handle cache

## 2.0.3-alpha.1

### Patch Changes

- 5df4c85: fix: circular reference while building ts engine

## 2.0.3-alpha.0

### Patch Changes

- f171c63: fix: use posix path to resolve id

## 2.0.2

### Patch Changes

- fix: build ts engine with external wasm

This log was last generated on Fri, 14 Jul 2023 13:11:15 GMT and should not be manually modified.

## 2.0.1

Fri, 14 Jul 2023 13:11:15 GMT

### Patches

- feat: support building ts engine with npm module

## 2.0.0

Thu, 13 Jul 2023 15:30:27 GMT

### Breaking changes

- BREAKING: change transformer to Transfomer and add Bundler interface
- refactor: use uniform babel && rollup module
- refactor: modularize @cocos/ccbuild

### Patches

- fix dts types && fix fs-extra version
- fix build ts engine with intrinsic flag

## 1.1.20

### Patch Changes

- 1cb3389: dperecate: build engine loose option

## 1.1.19

### Patch Changes

- bb5f1e5: fix: async bundle external wasm module

## 1.1.18

### Patch Changes

- 84d16d6: feat: wasm subpackage support umd

## 1.1.17

### Patch Changes

- fix: enumerateAllDependents doesn't resolve featureUnits' dependent chunks' dependent asset

## 1.1.16

### Patch Changes

- 40da2c0: fix: use inline dynamic imports on OH platform

## 1.1.15

### Patch Changes

- downgrade glob to fix compability with node14

## 1.1.14

### Patch Changes

- 1a46941: feat: support wasmSubpackage options on externalWasmLoader

## 1.1.13

### Patch Changes

- feat: support constant WASM_SUBPACKAGE

## 1.1.12

### Patch Changes

- 84a40ac: feat: support load wasm.fallback module && WASM_FALLBACK constant

## 1.1.11

### Patch Changes

- 58a3a35: feat: support buildEngine.enumerateAllDependents()

## 1.1.10

### Patch Changes

- e3c3221: fix: culling bullet wasm on wechat platform

## 1.1.9

### Patch Changes

- f7fe86e: feat: support constant CULL_ASM_JS_MODULE

## 1.1.8

### Patch Changes

- eb0ede7: fix: change .mem suffix to .bin

## 1.1.7

### Patch Changes

- 32d1541: feat: support loading '.js.mem' module
- 345fc75: fix: downgrade "typescript" version

## 1.1.6

### Patch Changes

- fix bullet wasm emit

## 1.1.5

### Patch Changes

- caffe4d: add FORCE_BANNING_BULLET_WASM constant, controlled by ammoJsWasm option

## 1.1.4

### Patch Changes

- 2aa2d7f: add EDITOR_NOT_IN_PREVIEW dynamic constant
- 8001c61: Revert "patch: add EDITOR_PREVIEW dynamic constant (#7)"

## 1.1.3

### Patch Changes

- 9406d42: add EDITOR_PREVIEW dynamic constant

## 1.1.2

### Patch Changes

- d70a215: fix: export `WASM_SUPPORT_MODE` for dynamic const

## 1.1.1

### Patch Changes

- fix: use fixed babel version

## 1.1.0

### Minor Changes

- 279e42a: feat: support engine WASM module building

### Patch Changes

- 6411ef4: feat: support CCBuildTsFieldDecoratorHelper

## 1.0.1-alpha.0

### Patch Changes

- d94d769: feat: support CCBuildTsFieldDecoratorHelper

## 1.0.0

### Major Changes

- e49f97e: integrate build js engine

### Patch Changes

- e49f97e: revert @rollup/plugin-node-resolve version to fix rollup issue https://github.com/rollup/plugins/issues/1464
- e49f97e: fix wrong rullup version deps
- d2b5b77: support keepTypes options
- bdea922: change @rollup/plugin-terser to rollup-plugin-terser
- d2b5b77: make PlatformType for string
- b2f4116: implement build ts engine
- 74eb0fc: use build js engine for OH platform
- remove assert that build js engine should be in BUILD mode
- ed9a9db: fix @rollup/plugin-json deps for editor-extension install
- 3ac56fa: change keepTypes to preserveType option

## 1.0.0-alpha.13

### Patch Changes

- change keepTypes to preserveType option

## 1.0.0-alpha.12

### Patch Changes

- support keepTypes options
- make PlatformType for string
- b2f4116: implement build ts engine

## 1.0.0-alpha.11

### Patch Changes

- use build js engine for OH platform

## 1.0.0-alpha.10

### Patch Changes

- change @rollup/plugin-terser to rollup-plugin-terser

## 1.0.0-alpha.9

### Patch Changes

- fix @rollup/plugin-json deps for editor-extension install

## 1.0.0-alpha.8

### Major Changes

- e49f97e: integrate build js engine

### Patch Changes

- e49f97e: revert @rollup/plugin-node-resolve version to fix rollup issue https://github.com/rollup/plugins/issues/1464
- e49f97e: fix wrong rullup version deps
