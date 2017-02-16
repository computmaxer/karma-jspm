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

/*eslint-env browser*/
/*global Promise*/

(function (karma, System) {

    // Check if System js exists or not
    if (!System) {
        throw new Error('SystemJS was not found. Please make sure you have ' +
            'initialized jspm via installing a dependency with jspm, ' +
            'or by running \'jspm dl-loader\'.');
    }

    // Override system js configurations
    var systemJsOverrides = karma.config.jspm.systemJs;
    for (var key in systemJsOverrides) {
        if (systemJsOverrides.hasOwnProperty(key)) {
            System[key] = systemJsOverrides[key];
        }
    }

    // Whats going on here? I've made the experience,
    // that some other plugins also override the
    // karma.loaded method, which leads to the
    // problem, that our "loaded" method get never
    // called. To prevent this we throw an error
    // if any other plugin trys to override "loaded";
    // To be honestly, I have no clue, if overriding
    // "loaded" is a good idea anyway. Unfortunetely
    // karma provides no documentation to write own
    // plugins. They only refer to existing ones.
    Object.defineProperty(karma, 'loaded', {
        set: function () {

            if(karma.config.jspm.ignoreOverrideError) return;

            throw new Error('karma.loaded was already overridden by karma-jspm. ' +
                'karma-jspm is not compatible with other plugins, which also overrides karma.loaded. ' +
                'You can set "ignoreOverrideError" true in karma.conf.js, if you want to ignore this error.');
        },
        get: function () {
            return loaded
        }
    });

    /**
     * Get called, when karma is fully loaded
     */
    function loaded() {

        // Exclude bundle configurations if useBundles option is not specified
        if (!karma.config.jspm.useBundles) {
            System.config({ bundles: [] });
        }

        // Load everything specified in loadFiles in the specified order
        var promiseChain = Promise.resolve();
        for (var i = 0; i < karma.config.jspm.expandedFiles.length; i++) {
            promiseChain = promiseChain.then((function (moduleName) {

                return function () {
                    return System['import'](moduleName);
                };
            })(removeExtension(karma.config.jspm.expandedFiles[i])));
        }

        promiseChain.then(function () {
            karma.start();
        }, function (e) {
            karma.error(e.name + ': ' + e.message);
        });
    }


    /**
     * Removes all file extensions which are defined in extensionsToStrip
     * @param fileName
     * @returns {*}
     */
    function removeExtension(fileName) {
      
      if(typeof karma.config.jspm.stripExtension === 'boolean' ? karma.config.jspm.stripExtension : true)

        (karma.config.jspm.extensionsToStrip || []).forEach(function (extension) {

            fileName = fileName.replace(new RegExp('\\.' + extension + '$'), '')
        });

        return fileName;
    }

})(window.__karma__, window.System);
