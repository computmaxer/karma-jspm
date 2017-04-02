/*
 * Copyright 2014-2015 Workiva Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var glob = require('glob');
var path = require('path');
var fs = require('fs');


function flatten(structure) {
    return [].concat.apply([], structure);
}

function expandGlob(file, cwd) {
    return glob.sync(file.pattern || file, {cwd: cwd});
}

var createPattern = function (path) {
    return {pattern: path, included: true, served: true, watched: false};
};

var createServedPattern = function(path, file){
    return {
        pattern: path,
        included: file && 'included' in file ? file.included : false,
        served: file && 'served' in file ? file.served : true,
        nocache: file && 'nocache' in file ? file.nocache : false,
        watched: file && 'watched' in file ? file.watched : true
    };
};

function getJspmPackageJson(dir) {
    var pjson = {};
    try {
        pjson = JSON.parse(fs.readFileSync(path.resolve(dir, 'package.json')));
    }
    catch (e) {
        pjson = {};
    }
    if (pjson.jspm) {
        for (var p in pjson.jspm)
            pjson[p] = pjson.jspm[p];
    }
    pjson.directories = pjson.directories || {};
    if (pjson.directories.baseURL) {
        if (!pjson.directories.packages)
            pjson.directories.packages = path.join(pjson.directories.baseURL, 'jspm_packages');
        if (!pjson.configFile)
            pjson.configFile = path.join(pjson.directories.baseURL, 'config.js');
    }
    return pjson;
}

module.exports = function(files, basePath, jspm, client, emitter) {
    // Initialize jspm config if it wasn't specified in karma.conf.js
    if(!jspm)
        jspm = {};
    if(!jspm.config)
        jspm.config = getJspmPackageJson(basePath).configFile || 'config.js';
    if(!jspm.beforeFiles)
        jspm.beforeFiles = [];
    if(!jspm.loadFiles)
        jspm.loadFiles = [];
    if(!jspm.serveFiles)
        jspm.serveFiles = [];
    if(!jspm.packages)
        jspm.packages = getJspmPackageJson(basePath).directories.packages || 'jspm_packages/';
    if(!client.jspm)
        client.jspm = {};
    if(jspm.paths !== undefined && typeof jspm.paths === 'object')
        client.jspm.paths = jspm.paths;
    if(jspm.meta !== undefined && typeof jspm.meta === 'object')
        client.jspm.meta = jspm.meta;
    if(jspm.map !== undefined && typeof jspm.map === 'object')
        client.jspm.map = jspm.map;

    // Pass on options to client
    client.jspm.useBundles = jspm.useBundles;
    client.jspm.stripExtension = jspm.stripExtension;

    var packagesPath = path.normalize(basePath + '/' + jspm.packages + '/');
    var browserPath = path.normalize(basePath + '/' + jspm.browser);
    var configFiles = Array.isArray(jspm.config) ? jspm.config : [jspm.config];
    var configPaths = configFiles.map(function(config) {
        return path.normalize(basePath + '/' + config);
    });

    // Add SystemJS loader and jspm config
    function getLoaderPath(fileName){
        var exists = glob.sync(packagesPath + fileName + '@*.js');
        if(exists && exists.length != 0){
            return packagesPath + fileName + '@*.js';
        } else {
            return packagesPath + fileName + '.js';
        }
    }

    Array.prototype.unshift.apply(files,
        configPaths.map(function(configPath) {
            return createPattern(configPath);
        })
    );

    // Needed for JSPM 0.17 beta
    if(jspm.browser) {
        files.unshift(createPattern(browserPath));
    }
    

    files.unshift(createPattern(__dirname + '/adapter.js'));

    var polyfillsFile = getLoaderPath('system-polyfills.src');
    if(fs.existsSync(polyfillsFile)) {
        files.unshift(createPattern(getLoaderPath('system-polyfills.src')));
    } else {
        console.warn('No system-polyfills present. If the browser does not support Promises, you may need to load a polyfill with jspm.beforeFiles'); //eslint-disable-line no-console
    }

    files.unshift(createPattern(getLoaderPath('system.src')));

    // Load beforeFiles to the beginning of the files array. Iterate
    // through the array in reverse to preserve the order
    jspm.beforeFiles.reverse().forEach(function(file) {
        files.unshift(createPattern(basePath + '/' + (file.pattern || file)));
    });

    // Loop through all of jspm.load_files and do two things
    // 1. Add all the files as "served" files to the files array
    // 2. Expand out and globs to end up with actual files for jspm to load.
    //    Store that in client.jspm.expandedFiles
    function addExpandedFiles() {
        client.jspm.expandedFiles = flatten(jspm.loadFiles.map(function (file) {
            files.push(createServedPattern(basePath + '/' + (file.pattern || file), typeof file !== 'string' ? file : null));
            return expandGlob(file, basePath);
        }));
    }
    addExpandedFiles();

    emitter.on('file_list_modified', addExpandedFiles);

    // Add served files to files array
    jspm.serveFiles.map(function(file){
        files.push(createServedPattern(basePath + '/' + (file.pattern || file)));
    });

    // Allow Karma to serve all files within jspm_packages.
    // This allows jspm/SystemJS to load them
    var jspmPattern = createServedPattern(
        packagesPath + '!(system-polyfills.src.js|system.src.js)/**', {nocache: jspm.cachePackages !== true}
    );
    jspmPattern.watched = false;
    files.push(jspmPattern);
};
