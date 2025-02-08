import { INTRINSIC_FLAG } from 'internal:constants';

export const str =  'intrinsic flag is true';

if (INTRINSIC_FLAG) {
    console.log('[intrinsic-flag-true.ts] intrinsic flag is true');
} else {
    console.log('[intrinsic-flag-true.ts] intrinsic flag is false');
}