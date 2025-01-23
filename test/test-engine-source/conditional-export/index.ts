
/** @export_if context.buildTimeConstants.HTML5 */
export const conditionalExport = { a: 1 };

/** @export_if !context.buildTimeConstants.HTML5 */
export const conditionalDontExport = { b: 2 };

/** @export_if context.buildTimeConstants.HTML5 */
export * from './ccc';

/** @export_if !context.buildTimeConstants.HTML5 */
export * from './ccc2';
