import { USE_INTRINSIC_FLAG } from 'internal:constants';

export const str =  'intrinsic flag is false';

if (USE_INTRINSIC_FLAG) {
    console.log('[intrinsic-flag-false.ts] intrinsic flag is true');
} else {
    console.log('[intrinsic-flag-false.ts] intrinsic flag is false');
}