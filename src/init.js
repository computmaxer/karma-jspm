var cwd = process.cwd();
var glob = require("glob");
var path = require("path");


function flatten(structure) {
  return [].concat.apply([], structure);
}

function expandGlob(file) {
  return glob.sync(file.pattern || file).map(function (filePath) {
    return filePath.replace(/\//g, path.sep);
  });
};

var createPattern = function(path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var createServedPattern = function(path){
  return {pattern: path, included: false, served: true, watched: true};
};

module.exports = function(files, basePath, jspm, client) {
  // Initialize jspm config if it wasn't specified in karma.conf.js
  if(!jspm)
    jspm = {};
  if(!jspm.config)
    jspm.config = "config.js";
  if(!jspm.loadFiles)
    jspm.loadFiles = [];
  if(!jspm.serveFiles)
    jspm.serveFiles = [];
  if(!jspm.packages)
    jspm.packages = "jspm_packages/";
  if(!client.jspm)
    client.jspm = {};

  packagesPath = path.normalize(cwd + '/' + jspm.packages + '/');
  configPath = path.normalize(cwd + '/' + jspm.config);

  // Allow Karma to serve all files within jspm_packages.
  // This allows jspm/SystemJS to load them
  files.unshift(createServedPattern(packagesPath + '**/*'));

  // Add SystemJS loader and jspm config
  files.unshift(createPattern(__dirname + '/adapter.js'));
  files.unshift(createPattern(configPath));
  files.unshift(createPattern(packagesPath + 'system@0.8.js'));
  files.unshift(createPattern(packagesPath + 'es6-module-loader@0.8.js'));

  // Loop through all of jspm.load_files and do two things
  // 1. Add all the files as "served" files to the files array
  // 2. Expand out and globs to end up with actual files for jspm to load. 
  //    Store that in client.jspm.expandedFiles
  client.jspm.expandedFiles = flatten(jspm.loadFiles.map(function(file){
    files.push(createServedPattern(cwd + "/" + (file.pattern || file)));
    return expandGlob(file);
  }));

  // Add served files to files array
  jspm.serveFiles.map(function(file){
    files.push(createServedPattern(cwd + "/" + (file.pattern || file)));
  });
};
