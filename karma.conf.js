
module.exports = function(config) {
    config.set({
        basePath: '',
        singleRun: true,
        frameworks: [
            'jasmine'
        ],
        files: [
            'test/karma.js'
        ],
        preprocessors: {
            'test/karma.js': ['webpack'],
        },
        browsers: ['CustomChromiumHeadless'], // ChromeHeadless | Chrome
        customLaunchers: {
            CustomChromiumHeadless: {
                base: 'ChromiumHeadless',
                flags: ['--no-sandbox', '--disable-software-rasterizer --disable-dev-shm-usage']
            }
        },
        reporters: [
            'spec',     // https://github.com/mlex/karma-spec-reporter
            'coverage', // https://github.com/karma-runner/karma-coverage
        ],
        specReporter: {
            maxLogLines: 5, 
            suppressErrorSummary: true,
            suppressFailed: false,
            suppressPassed: false,
            suppressSkipped: true, 
            showSpecTiming: true
        },
        coverageReporter: {
            dir: 'coverage',
            subdir: '.',
            reporters: [
                {type: 'text-summary'},
                {type: 'html'}
            ]
        },

        webpack: require('./test/webpack.config'),
        webpackMiddleware: {
            logLevel: 'error'
        },
    });
};