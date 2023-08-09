const fs = require('fs-extra');
const ps = require('path').posix;

const pkg = ps.join(__dirname, '../package.json');
let content = fs.readFileSync(pkg, 'utf8');
content = content.replace(`"workspaces"`, `"_workspaces_"`);
fs.writeFileSync(pkg, content, 'utf8');