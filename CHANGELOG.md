# @cocos/ccbuild

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
