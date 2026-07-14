// Imported via the wildcard tsconfig alias `@cocos/test-engine/*` (see tsconfig.json),
// mirroring how privatized pal files import engine internals via `@cocos/engine/*`.
// The `@cocos/` prefix also exercises node-module-loader's graceful fallback (it is not
// an installed node module). Side-effect import only, so it stays out of the bundled cc.d.ts.
import '@cocos/test-engine/wildcard-alias/target';
