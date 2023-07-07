const { formatPath, rebasePath } = require("@ccbuild/utils");
const { babel: Transformer } = require('@ccbuild/transformer');
const ps = require('path');
const fs = require('fs-extra');
const JSON5 = require('json5');
const glob = require('glob');

const babel = Transformer.core;
const pluginSyntaxTS = Transformer.plugins.syntaxTS;

// init data
const rushRootDir = ps.join(__dirname, '../');
const deployDir = ps.join(rushRootDir, './deploy/');
const rushProjects = JSON5.parse(fs.readFileSync(ps.join(rushRootDir, './rush.json'), 'utf8')).projects;
const pkgFileList = rushProjects.map(project => ps.join(rushRootDir, project.projectFolder, 'package.json'));

const pkgName2Main = {};
const pkgName2Types = {};
const filesToCopy = [];
const allDeps = {};
pkgFileList.forEach(pkgFile => {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    const pkgName = pkg.name;
    // get pkgName2Main
    if (pkg.main) {
        const indexPath = pkg.main;
        pkgName2Main[pkgName] = ps.join(ps.dirname(pkgFile), indexPath);
    } else {
        console.warn(`package ${pkgName} lacks field 'main'`);
    }
    // get pkgName2Types
    if (pkg.types) {
        const typesPath = pkg.types;
        pkgName2Types[pkgName] = ps.join(ps.dirname(pkgFile), typesPath);
    } else {
        console.warn(`package ${pkgName} lacks field 'types'`);
    }
    // get filesToCopy
    if (pkg.files) {
        for (let filePattern of pkg.files) {
            filePattern = formatPath(ps.join(ps.dirname(pkgFile), filePattern));
            filesToCopy.push(...glob.globSync(filePattern).filter(file => !fs.statSync(file).isDirectory()));
        }
    } else {
        console.warn(`package ${pkgName} lacks field 'files'`);
    }
    // get allDeps
    for (const dep in pkg.dependencies) {
        const depVersion = pkg.dependencies[dep];
        if (dep in allDeps && allDeps[dep] !== depVersion) {
            console.warn(`package '${pkgName}' has different dep version of package '${dep}', which is '${depVersion}'`);
            continue;
        }
        allDeps[dep] = depVersion;
    }

});

// clear deploy dir
console.log('clear deploy dir');
if (fs.existsSync(deployDir)) {
    fs.rmdirSync(deployDir, { recursive: true });
}

// copy files
console.log('copy files to deploy dir');
filesToCopy.forEach(file => {
    const copyTarget = rebasePath(file, rushRootDir, deployDir);
    const buffer = fs.readFileSync(file);
    fs.outputFileSync(copyTarget, buffer);
});

// transform dts files
console.log('transform .d.ts files');
const dtsFiles = glob.globSync(formatPath(ps.join(deployDir, '**/*.d.ts')));
for (const file of dtsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const res = babel.transformSync(code, {
        plugins: [
            [pluginSyntaxTS],
            {
                visitor: {
                    'ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration' (path) {
                        const sourcePath = path.get('source');
                        if (sourcePath.node) {
                            const sourceValue = sourcePath.node.value;
                            if (sourceValue in pkgName2Types) {
                                const deployTypesPath = rebasePath(pkgName2Types[sourceValue], rushRootDir, deployDir);
                                const replaceValue = formatPath(ps.relative(ps.dirname(file), deployTypesPath)).replace('.d.ts', '');
                                sourcePath.replaceWith(babel.types.stringLiteral(replaceValue));
                            }
                        }
                    },
                }
            }
        ]
    });
    if (res.code) {
        fs.writeFileSync(file, res.code, 'utf8');
    }
}

// transform js files
console.log('transform js files');
const jsFiles = glob.globSync(formatPath(ps.join(deployDir, '**/*.js')));
for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const res = babel.transformSync(code, {
        plugins: [
            {
                visitor: {
                    CallExpression (path) {
                        const calleePath = path.get('callee');
                        if (calleePath.type === 'Identifier' && calleePath.node.name === 'require') {
                            const argPath = path.get('arguments')[0];
                            const argValue = argPath.node.value;
                            if (argValue in pkgName2Main) {
                                const deployMainPath = rebasePath(pkgName2Main[argValue], rushRootDir, deployDir);
                                const replaceValue = formatPath(ps.relative(ps.dirname(file), deployMainPath));
                                argPath.replaceWith(babel.types.stringLiteral(replaceValue));
                            }
                        }
                    }
                }
            }
        ]
    });
    if (res.code) {
        fs.writeFileSync(file, res.code, 'utf8');
    }
}

// generate package.json
console.log('generate package.json');

const rootPkgFile = ps.join(rushRootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgFile, 'utf8'));
rootPkg.dependencies = allDeps;
delete rootPkg.devDependencies;
delete rootPkg.scripts;
for (const dep in rootPkg.dependencies) {
    if (rootPkg.dependencies[dep] === 'workspace:*') {
        delete rootPkg.dependencies[dep];
    }
}
rootPkg.main = './lib/src/index.js';
rootPkg.types = './lib/src/index.d.ts';
rootPkg.exports = {};
const dotExports = rootPkg.exports['.'] = {};
dotExports['types'] = './lib/src/index.d.ts';
dotExports['default'] = './lib/src/index.js';
rootPkg.files.push('modules/**/*');
fs.writeFileSync(ps.join(deployDir, 'package.json'), JSON.stringify(rootPkg, undefined, 4), 'utf8');
