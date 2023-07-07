import { Command } from 'commander';
import { ModuleManager } from '.';

const program = new Command('Module Manager');
program.command('init')
    .argument('<packageName>', 'the name of package.json')
    .argument('<modulePath>', 'module path')
    .argument('<extendTsConfigPath>', 'extend tsconfig.json path')
    .action(async (packageName, modulePath, extendTsConfigPath) => {
        console.log(modulePath);
        
        const mm = new ModuleManager();
        const result = await mm.initModule(modulePath, {
            pkgName: packageName,
            extendTsconfigPath: extendTsConfigPath,
        });
        for (const mf of result.memoryFiles) {
            await mf.outputFile();
        }
    });

program.parse();