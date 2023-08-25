const { ps } = require('@ccbuild/utils');
const fs = require('fs-extra');
const { spawnSync } = require('child_process');
const del = require('del');
const chalk = require('chalk');

(async function () {
    const targetNodeModules = ps.join(__dirname, '../test/test-engine-source/node_modules');
    const installNodeModules = ps.join(__dirname, '../test/test-engine-source/node-modules-to-install');
    console.log(chalk.green('Removing test node_modules...'));
    await del(targetNodeModules, {force: true});

    console.log(chalk.green('Linking test node_modules...'));
    spawnSync(
        (process.platform === 'win32' ? 'npm.cmd' : 'npm'),
        ['install', '--no-package-lock', '--install-strategy', 'linked'],
        {
            cwd: ps.join(__dirname, '../test/test-engine-source'),
        },
    );
    
    console.log(chalk.green('Copying test node_modules...'));
    await fs.copy(installNodeModules, targetNodeModules);
})();