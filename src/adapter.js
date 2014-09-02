(function(karma, System) {

    // Prevent immediately starting tests.
    window.__karma__.loaded = function() {};

    function extractModuleName(fileName){
        return fileName.replace(/\.js$/, "");
    }

    var promises = [];
    karma.config.jspm.expandedFiles.map(function(modulePath){
        // Prepend base to each path. Karma serves files from /base/
        promises.push(System.import('base/' + extractModuleName(modulePath)));
    });

    // Promise comes from the es6_module_loader
    Promise.all(promises).then(function(){
        karma.start();
    });

})(window.__karma__, window.System);
