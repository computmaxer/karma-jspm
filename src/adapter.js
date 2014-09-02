/*
 * Copyright 2014 Workiva, LLC
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
