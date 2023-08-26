const viz = require('graphviz');
const { ps } = require('@ccbuild/utils');
const fs = require('fs-extra');
const glob = require('glob');

const graph = viz.digraph('ccbuild');
const rootPkg = ps.join(__dirname, '../package.json');
const rootPkgJson = fs.readJsonSync(rootPkg);

const data = {};

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
            data[pkgJson.name] = data[pkgJson.name] ?? [];;
            if (v === '*') {
                data[pkgJson.name].push(k);
            }
        }
    }
}

for (const k in data) {
    const node = graph.addNode(k);
    node.set('shape', 'rect');
}

for (const [moduleName, deps] of Object.entries(data)) {
    for (const dep of deps) {
        graph.addEdge(moduleName, dep);
    }
}

graph.output('png', ps.join(__dirname, '../graph.png'));