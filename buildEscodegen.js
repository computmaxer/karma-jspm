var cjsify = require('commonjs-everywhere').cjsify;
var fs = require('fs');
var escodegen = require('escodegen');

fs.writeFileSync('./escodegen.js', '(function () {\n' +
    '\'use strict\';\n' +
    'global.escodegen = require(\'escodegen\');\n' +
    'escodegen.browser = true;\n' +
    '}());\n');

var result = cjsify('./escodegen.js', process.cwd(), {aliases: {'path': ''}});
var code = escodegen.generate(result, {
    sourceMap: false,
    sourceMapWithCode: false,
    format: escodegen.FORMAT_MINIFY
});
fs.writeFileSync('./escodegen.js', code);

