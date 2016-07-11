/*global describe, expect, it, beforeEach*/

var cwd = process.cwd();
var path = require('path');
var initJspm = require('../src/init');

var normalPath = function(path){
    return path.replace(/\\/g,'/');
};

describe('jspm plugin init', function(){
    var files, jspm, client, emitter;
    var basePath = path.resolve(__dirname, '..');

    beforeEach(function(){
        files = [];
        jspm = {
            browser: 'custom_browser.js',
            config: 'custom_config.js',
            loadFiles: ['src/**/*.js',{pattern:'not-cached.js', nocache:true}, {pattern:'not-watched.js', watched:false}],
            packages: 'custom_packages/',
            serveFiles: ['testfile.js']
        };
        client = {};
        emitter = {
            on: function() {}
        };

        initJspm(files, basePath, jspm, client, emitter);
    });

    it('should add config.js to the top of the files array', function(){
        expect(normalPath(files[4].pattern)).toEqual(normalPath(basePath + '/custom_config.js'));
        expect(files[4].included).toEqual(true);
    });

    it('should add browser.js to the top of the files array', function(){
        expect(normalPath(files[3].pattern)).toEqual(normalPath(basePath + '/custom_browser.js'));
        expect(files[3].included).toEqual(true);
    });

    it('should support an array of config files', function() {
        jspm.config = ['custom_config.js', 'another_config.js'];
        files = [];
        initJspm(files, basePath, jspm, client, emitter);
        expect(normalPath(files[4].pattern)).toEqual(normalPath(basePath + '/custom_config.js'));
        expect(normalPath(files[5].pattern)).toEqual(normalPath(basePath + '/another_config.js'));
    });

    it('should add adapter.js to the top of the files array', function(){
        expect(normalPath(files[2].pattern)).toEqual(normalPath(basePath + '/src/adapter.js'));
        expect(files[2].included).toEqual(true);
    });

    it('should add systemjs-polyfills to the top of the files array', function(){
        expect(normalPath(files[1].pattern)).toEqual(normalPath(basePath + '/custom_packages/system-polyfills.src.js'));
        expect(files[1].included).toEqual(true);
    });

    it('should add systemjs to the top of the files array', function(){
        expect(normalPath(files[0].pattern)).toEqual(normalPath(basePath + '/custom_packages/system.src.js'));
        expect(files[0].included).toEqual(true);
    });

    it('should add files from jspm.loadFiles to client.expandedFiles', function(){
        expect(client.jspm.expandedFiles).toEqual(['src/adapter.js', 'src/init.js']);
    });

    it('should add files from jspm.serveFiles to the files array as served files', function(){
        expect(normalPath(files[files.length - 2].pattern)).toEqual(normalPath(cwd + '/testfile.js'));
        expect(files[files.length - 2].included).toEqual(false);
        expect(files[files.length - 2].served).toEqual(true);
        expect(files[files.length - 2].watched).toEqual(true);
    });

    it('should use the configured jspm_packages path and include it at the end of the files array', function(){
        expect(normalPath(files[files.length - 1].pattern)).toEqual(normalPath(path.resolve(cwd, './custom_packages/!(system-polyfills.src.js|system.src.js)/**')));
        expect(files[files.length - 1].included).toEqual(false);
        expect(files[files.length - 1].served).toEqual(true);
        expect(files[files.length - 1].watched).toEqual(false);
    });

    it('should assign true to nocache option to served files with nocache option in jspm.loadFiles', function(){
        expect(normalPath(files[files.length - 4].pattern)).toEqual(normalPath(cwd + '/not-cached.js'));
        expect(files[files.length - 4].included).toEqual(false);
        expect(files[files.length - 4].served).toEqual(true);
        expect(files[files.length - 4].watched).toEqual(true);
        expect(files[files.length - 4].nocache).toEqual(true);
    });

    it('should respect watched flag when adding jspm.loadFiles to served files', function(){
        expect(normalPath(files[files.length - 3].pattern)).toEqual(normalPath(cwd + '/not-watched.js'));
        expect(files[files.length - 3].included).toEqual(false);
        expect(files[files.length - 3].served).toEqual(true);
        expect(files[files.length - 3].watched).toEqual(false);
        expect(files[files.length - 3].nocache).toEqual(false);
    });
});
