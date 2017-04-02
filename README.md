# karma-jspm  [![Build Status](https://travis-ci.org/Workiva/karma-jspm.svg?branch=master)](https://travis-ci.org/Workiva/karma-jspm)

karma-jspm includes the jspm module loader for karma runs. This allows dynamic loading of src/test files and modules. No longer do you need to worry about browserifying your src or tests before every test run!

##Installation##

Available in npm: `npm install karma-jspm --save-dev`

**This plugin assumes you are using jspm in your project.** You will need to have a `config.js` in the root of your project (though this is configurable) as well as a `jspm_packages` directory containing systemjs and the es6-module-loader.

**This plugin can now support JSPM 0.17 beta**
##Configuration##

*karma.conf.js*

Include this plugin in your frameworks:

```js
frameworks: ['jspm', 'jasmine'],
```

Karma auto loads plugins unless you specify a plugins config. If you have one, you'll also need to add it there:

```js
plugins: ['karma-jspm', 'karma-phantomjs-launcher'],
```

The `loadFiles` configuration tells karma-jspm which files should be dynamically loaded via systemjs *before* the tests run. Globs or regular file paths are acceptable. 


**You should not include these in the regular karma files array.** karma-jspm takes care of this for you.

```js
jspm: {
    // Edit this to your needs
    loadFiles: ['src/**/*.js', 'test/**/*.js']
}
```

That's it!


###Optional Configuration###

You may have named your jspm `config.js` file or `jspm_packages` directory something else. In this case simply add that to the jspm configuration in *karma.conf.js*:

```js
jspm: {
    config: "myJspmConfig.js",
    packages: "my_jspm_modules/"
}
```

For JSPM 0.17 Beta, you have to specify the `jspm.browser.js` file.

```js
jspm: {
    browser: "myJspmBrowser.js",
}
```

If you use jspm 0.17 beta >33 and are running tests in a browser without native Promise support (like phantomjs <2.5), you can load a polyfill by adding your file(s) 
in beforeFiles. For example, install babel-polyfill with `npm install --save-dev babel-polyfill` and then add the line below to the karma config:

```js
jspm: {
    beforeFiles: ['node_modules/babel-polyfill/dist/polyfill.js']
}
```

You may want to make additional files/a file pattern available for jspm to load, but not load it right away. Simply add that to `serveFiles`. 
One use case for this is to only put test specs in `loadFiles`, and jspm will only load the src files when and if the test files require them. Such a config would look like this:

```js
jspm: {
    loadFiles: ['test/**/*.js'],
    serveFiles: ['src/**/*.js']
}
```

By default karma-jspm ignores jspm's bundles configuration. To re-enable it, specify the `useBundles` option.

```js
jspm: {
    useBundles: true
}
```

Depending on your framework and project structure it might be necessary to override jspm paths for the testing scenario.
In order to do so just add the `paths` property to the jspm config object in your karma-configuration file, along with the overrides:
 
```js
jspm: {
    paths: {
        '*': 'yourpath/*.js',
        ...
    }
}
``` 

By default the plugin will strip the file extension of the js files. To disable that, specify the `stripExtension` option:

```js
jspm: {
    stripExtension: false
}
```

Most of the time, you do not want to cache your entire jspm_packages directory, but serve it from the disk. This is done by default, but can be reversed as follows:

```js
jspm: {
    cachePackages: true
}
```
