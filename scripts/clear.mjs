import { deleteAsync } from 'del';
import ps from 'path';
import { fileURLToPath } from 'url';
const __dirname = ps.dirname(fileURLToPath(import.meta.url));

function relativePath (path) {
    return ps.join(__dirname, path).replace(/\\/g, '/');
}

[
    relativePath('../lib'),
].forEach(async dir => {
    await deleteAsync(dir, {force: true});
});