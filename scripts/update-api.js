const gift = require('tfig')
const ps = require('path').posix;
const fs = require('fs-extra');

const input = ps.join(__dirname, '../lib/src/index.d.ts');
const output = ps.join(__dirname, '../.api/public.d.ts');
const bundle = gift.bundle({
    input: [input],
    entries: {
        '@cocos/ccbuild': input,
    },
    output,
})

fs.writeFileSync(output, bundle.groups[0].code, 'utf8');