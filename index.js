var initJspm = require('./src/init');

initJspm.$inject = ['config.files', 'config.basePath', 'config.jspm', 'config.client'];

module.exports = {
  'framework:jspm': ['factory', initJspm]
};
