const del = require('del');
const ps = require('path');

function relativePath (path) {
    return ps.join(__dirname, path).replace(/\\/g, '/');
}

[
    relativePath('../lib'),
].forEach(async dir => {
    await del(dir, {force: true});
});