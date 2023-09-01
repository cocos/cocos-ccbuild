const viz = require('graphviz');
const { ps } = require('@ccbuild/utils');
const fs = require('fs-extra');
const glob = require('glob');

const graph = viz.digraph('ccbuild');
const rootPkg = ps.join(__dirname, '../package.json');
const rootPkgJson = fs.readJsonSync(rootPkg);

const depMap = {};
const devDepMap = {};
const peerDepMap = {};

const modules = [];
for (const w of rootPkgJson.workspaces) {
    let files = glob.sync(ps.join(ps.dirname(rootPkg), w), {
        ignore: '**/node_modules/**/*',
    });
    files = files.map(f => fs.statSync(f).isDirectory() && fs.existsSync(ps.join(f, 'package.json'))? ps.join(f, 'package.json'): f);
    files = files.filter(f => f.endsWith('package.json'));
    modules.push(...files);
}

for (const m of modules) {
    const pkgJson = fs.readJsonSync(m);
    if (pkgJson.dependencies) {
        for (const [k, v] of Object.entries(pkgJson.dependencies)) {
            depMap[pkgJson.name] = depMap[pkgJson.name] ?? [];;
            if (v === '*') {
                depMap[pkgJson.name].push(k);
            }
        }
    }
    if (pkgJson.devDependencies) {
        for (const [k, v] of Object.entries(pkgJson.devDependencies)) {
            devDepMap[pkgJson.name] = devDepMap[pkgJson.name] ?? [];;
            if (v === '*') {
                devDepMap[pkgJson.name].push(k);
            }
        }
    }
    if (pkgJson.peerDependencies) {
        for (const [k, v] of Object.entries(pkgJson.peerDependencies)) {
            peerDepMap[pkgJson.name] = peerDepMap[pkgJson.name] ?? [];;
            if (v === '*') {
                peerDepMap[pkgJson.name].push(k);
            }
        }
    }
}

for (const map of [depMap, devDepMap, peerDepMap]) {
    for (const k in map) {
        const node = graph.from(k);
        node.set('shape', 'rect');
    }
}

for (const [moduleName, deps] of Object.entries(depMap)) {
    for (const dep of deps) {
        graph.addEdge(moduleName, dep);
    }
}
for (const [moduleName, deps] of Object.entries(devDepMap)) {
    for (const dep of deps) {
        const edge = graph.addEdge(moduleName, dep);
        edge.set('color', 'gray');
    }
}
for (const [moduleName, deps] of Object.entries(peerDepMap)) {
    for (const dep of deps) {
        const edge = graph.addEdge(moduleName, dep);
        edge.set('color', 'purple');
    }
}

graph.output('png', ps.join(__dirname, '../graph.png'));