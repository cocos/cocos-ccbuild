import { USE_INTRINSIC_FLAG } from 'internal:constants';

export const str =  'intrinsic flag is true';

if (USE_INTRINSIC_FLAG) {
    console.log('[intrinsic-flag-true.ts] intrinsic flag is true');
} else {
    console.log('[intrinsic-flag-true.ts] intrinsic flag is false');
}