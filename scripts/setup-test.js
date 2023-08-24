const { ps } = require('@ccbuild/utils');
const fs = require('fs-extra');
const { spawnSync } = require('child_process');
const del = require('del');
const chalk = require('chalk');

(async function () {
    console.log(chalk.green('Removing test node_modules...'));
    await del(ps.join(__dirname, '../test/test-engine-source/node_modules'), {force: true});

    console.log(chalk.green('Linking test node_modules...'));
    spawnSync(
        (process.platform === 'win32' ? 'npm.cmd' : 'npm'),
        ['install', '--no-package-lock', '--install-strategy', 'linked'],
        {
            cwd: ps.join(__dirname, '../test/test-engine-source'),
        },
    );
    
    console.log(chalk.green('Copying test node_modules...'));
    await fs.copy(ps.join(__dirname, '../test/test-engine-source/copy-to-node-modules'), ps.join(__dirname, '../test/test-engine-source/node_modules'));
})();