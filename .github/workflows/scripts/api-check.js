const fs = require('fs');
const ps = require('path');

const oldVer = ps.join(__dirname, '../../../.api/public_old.d.ts');
const newVer = ps.join(__dirname, '../../../.api/public.d.ts');
const oldContent = fs.readFileSync(oldVer, 'utf8');
const newContent = fs.readFileSync(newVer, 'utf8');

if (oldContent !== newContent) {
    console.error(`please run 'npm run api' to update public.d.ts, and commit this file.`);
    process.exit(1);
}