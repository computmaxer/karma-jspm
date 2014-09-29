#karma-jspm#

karma-jspm includes the jspm module loader for karma runs. This allows dynamic loading of src/test files and modules. No longer do you need to worry about browserifying your src or tests before every test run!

##Installation##

Available in npm: `npm install karma-jspm`

**This plugin assumes you are using jspm in your project.** You will need to have a `config.js` in the root of your project (though this is configurable) as well as a `jspm_packages` directory containing systemjs and the es6-module-loader.

##Configuration##

*karma.conf.js*

Include this plugin in your frameworks:

```js
frameworks: ['jspm', 'jasmine'],
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

You may want to make additional files/a file pattern available for jspm to load, but not load it right away. Simply add that to `serveFiles`. 
One use case for this is to only put test specs in `loadFiles`, and jspm will only load the src files when and if the test files require them. Such a config would look like this:

```js
jspm: {
    loadFiles: ['test/**/*.js'],
    serveFiles: ['src/**/*.js']
}
```

###Dealing with Bundles###

Currently the best way to test with jspm bundles is to output them into a directory that you can proxy to. You could output them into `jspm_packages` since you've already created a proxy configuration for that directory.
While this would work, it may not be the cleanest approach.

Consider creating a `bundles` directory and modifying your proxy configuration as such:

```js
proxies: {
    '/jspm_packages/': '/base/jspm_packages/',
    '/bundles/': '/base/bundles/'
}
```

You will also need to add a pattern like `bundles/**/*.js` to either `loadFiles` or `serveFiles`.

Then your jspm bundle command would need to look something like this:

```bash
jspm bundle some_package bundles/package.js --inject
```
