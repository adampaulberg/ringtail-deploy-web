// Karma configuration

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [ 'mocha', 'sinon-chai' ],

    // load the plugins
    plugins: [
      'karma-chrome-launcher',
      'karma-coverage',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-ng-html2js-preprocessor',
      'karma-phantomjs-launcher',
      'karma-sinon-chai'
    ],


    // list of files / patterns to load in the browser
    files: [
      'src/client/assets/bower_components/jquery/dist/jquery.min.js',
      'src/client/assets/bower_components/bootstrap/dist/js/bootstrap.min.js',
      'src/client/assets/bower_components/angular/angular.js',
      'src/client/assets/bower_components/angular-mocks/angular-mocks.js',
      'src/client/assets/bower_components/angular-route/angular-route.js',
      'src/client/assets/bower_components/angular-resource/angular-resource.js',
      'src/client/assets/bower_components/angular-animate/angular-animate.js',
      'src/client/assets/bower_components/angular-bootstrap/ui-bootstrap.js',
      'src/client/assets/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'src/client/assets/bower_components/underscore/underscore.js',

      'src/client/app/**/_module.js',
      'src/client/app/**/*.js',
      'src/client/app/**/*.html',

      'test/client/**/*.js',
    ],


    // list of files to exclude
    exclude: [
      'src/client/index.html'
    ],

    // get paths in alignment with deployment
    proxies: {
      '/assets/': 'src/client/assets/'
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/client/!(assets)/**/*.js' : ['coverage'],
      'src/client/!(assets)/**/*.html': ['ng-html2js']
    },

    coverageReporter: {
      type: 'text-summary'
    },

    ngHtml2JsPreprocessor: {
      moduleName: 'templates',
      stripPrefix: 'src/client/app',
      prependPrefix: '/app'
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage' ],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Chrome'],
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
