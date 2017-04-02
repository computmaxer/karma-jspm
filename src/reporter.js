var rimraf = require('rimraf');
var remapIstanbul = require('remap-istanbul');
var karmaCoverageReport = require('karma-coverage/lib/reporter');

function CoverageReporter(rootConfig, helper, logger, emitter) {
    var log = logger.create('reporter-wrapper.coverage');
    var config = rootConfig.coverageReporter = rootConfig.coverageReporter || {};
    config._onWriteReport = function (collector) {
        try {
            collector = remapIstanbul.remap(collector.getFinalCoverage());
        } catch(e) {
            log.error(e);
        }
        return collector;
    };
    config._onExit = function (done) {
        try {
            rimraf.sync(rootConfig.client.jspm.coverage.tempDirectory);
        } catch(e) {
            log.error(e);
        }
        done();
    };
    karmaCoverageReport.call(this, rootConfig, helper, logger, emitter);
}

CoverageReporter.$inject = karmaCoverageReport.$inject;

// PUBLISH
module.exports = CoverageReporter;
