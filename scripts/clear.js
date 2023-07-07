const { absolutePathFuncFactory } = require('@ccbuild/utils');
const del = require('del');
const ps = require('path');

const absolutePath = absolutePathFuncFactory(__dirname);

[
    absolutePath('../lib'),
].forEach(async dir => {
    await del(dir, {force: true});
});