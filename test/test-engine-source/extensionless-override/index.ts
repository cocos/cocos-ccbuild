// The virtual module `pal/system-info-test` is remapped in cc.config.json to an
// extension-less override target (`pal/system-info-test/native/system-info`), mirroring
// how privatized pal modules are declared. A bare side-effect import is enough to force
// the native ts builder to load the override target, exercising its extension completion.
// It is intentionally not re-exported, so this fixture stays out of the bundled cc.d.ts.
import 'pal/system-info-test';
