var fs = require('fs');
var path = require('path');
var jspm = require('jspm');
var istanbul = require('istanbul');
var rimraf = require('rimraf');
var inlineSourceMap = require('inline-source-map-comment');

function getFileKey(filename, basePath) {
    if(!basePath) throw new Error('Please supply a base path!');
    return filename.replace(basePath + '/', '');
}

function getOSFilePath(filename) {
    return filename.replace('file://', '');
}

function CoveragePreprocessor(basePath, client, reporters, helper, logger) {
    var log = logger.create('preprocessor.coverage');

    // if coverage reporter is not used, do not preprocess the files
    if (!helper._.includes(reporters, 'jspm')) {
        return function (content, _, done) {
            done(content);
        };
    }

    // create a jspm namespace to pass data to the browsers
    if (!client.jspm) client.jspm = {};
    // store instrumented sources to be executed by browser
    client.jspm.coverage = {
        files: {}
    };
    // store basePath used to generate the key for each source in the obj above
    client.jspm.coverage.basePath = basePath;
    // temp folder to store instrumented files for sourcemap remapping
    client.jspm.coverage.tempDirectory = path.join(__dirname, '../no-source-map/');

    // make temp directory
    var tempDirectory = client.jspm.coverage.tempDirectory;
    if (!fs.existsSync(tempDirectory)) {
        fs.mkdirSync(tempDirectory);
    }

    // create systemjs hook to allow Istanbul to instrument transpiled sources
    var instrument = new istanbul.Instrumenter();
    var systemJS = new jspm.Loader();
    var systemInstantiate = systemJS.instantiate;

    // "instantiate" is the hook that provides the transpiled source
    systemJS.instantiate = function(load) {
        try {
            // create a unique key to store the sources of modules for the browser
            var fileKey = getFileKey(getOSFilePath(load.address), basePath);
            // exclude the dependency modules (i.e. libraries) from instrumentation
            if (client.jspm.coverage.files[fileKey]) {
                // put file's transpiled counterpart in temp folder
                var filename;
                var sourceMap = '';
                // arrange sourcemaps
                if (load.metadata.sourceMap) {
                    filename = path.join(tempDirectory, fileKey.replace(/\//g, '|'));
                    // keeping sourcesContent causes duplicate reports
                    // it's an issue with remap-istanbul that hasn't
                    // been investigated yet.
                    delete load.metadata.sourceMap.sourcesContent;
                    // this is the file being "instrumented"
                    load.metadata.sourceMap.file = filename;
                    // normalize the main source filename
                    load.metadata.sourceMap.sources[0] = load.address;
                    // removing "file://" from paths
                    load.metadata.sourceMap.sources = load.metadata.sourceMap.sources.map(function (filename) {
                        return getOSFilePath(filename);
                    });
                    // inlined-sourceMap to be added to file
                    sourceMap = '\n' + inlineSourceMap(load.metadata.sourceMap);
                } else if (load.source.trim() === fs.readFileSync(getOSFilePath(load.address), 'utf8').trim()) {
                    // actual file source is the same as load.source
                    // let the original file through
                    filename = getOSFilePath(load.address);
                } else {
                    // there is no source, but is transpiled, so we have no choice but to
                    // create a temp file that cannot be mapped back to the original
                    // I think that we should throw an error here, telling the user to figure out
                    // why it is that no sourcemap is being generated.
                    filename = path.join(tempDirectory, fileKey.replace(/\//g, '|'));
                }

                if (filename !== getOSFilePath(load.address)) {
                    // write transpiled file with to temp directory
                    fs.writeFileSync(filename, load.source + sourceMap);
                }

                // instrument with istanbul
                client.jspm.coverage.files[fileKey] = instrument.instrumentSync(
                    load.source,
                    // make the path-like file key into something that can be used as a name
                    filename
                );
            }
        } catch (err) {
            log.error(err);
            // remove temp directory since something went wrong
            rimraf.sync(tempDirectory);
        }
        // call the original "instantiate" hook function
        return systemInstantiate.call(systemJS, load);
    };

    return function (content, file, done) {
        // only files to be instrumented pass through here
        // store this information to allow "instantiate" to exclude
        // dependency modules (i.e. libraries)
        client.jspm.coverage.files[getFileKey(file.path, basePath)] = true;
        // import modules
        systemJS.import(file.path).then(function () {
            done(content);
        }).catch(function(err) {
            done(content);
        });
    };
}

CoveragePreprocessor.$inject = ['config.basePath','config.client','config.reporters','helper', 'logger'];

// PUBLISH
module.exports = CoveragePreprocessor;
