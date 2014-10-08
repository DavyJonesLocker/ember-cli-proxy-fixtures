var fs         = require('fs');
var path       = require('path');
var mkdirp     = require('mkdirp');
var jsonConcat = require('broccoli-json-concat');
var middleware = require('./lib/middleware');
var bodyParser = require('body-parser');
var path       = require('path');

module.exports = {
  name: 'ember-cli-proxy-fixtures',

  validEnv: function() {
    return this.app.env !== 'production' && this.app.env !== 'staging';
  },

  blueprintsPath: function() {
    return path.join(__dirname, 'blueprints');
  },

  treeForVendor: function() {
    if(!this.validEnv()) { return; }

    var proxyFixturesPath = path.join(this.app.project.root, 'tests/fixtures/proxy');
    if (!fs.existsSync(proxyFixturesPath)) {
      mkdirp.sync(proxyFixturesPath);
    }
    var proxyTree = jsonConcat(proxyFixturesPath, {
      outputFile: 'proxyFixtures.js',
      variableName: 'window.proxyFixtures'
    });

    var lib = this.treeGenerator(path.join(__dirname, 'lib'));
    var qunit = this.pickFiles(lib, {
      files: ['qunit.js'],
      srcDir: '/',
      destDir: '/'
    });

    return this.concatFiles(this.mergeTrees([proxyTree, qunit]), {
      inputFiles: ['**/*.js'],
      outputFile: '/qunit-proxy-fixtures.js'
    });
  },

  included: function(app) {
    this.app = app;

    if(!this.validEnv()) { return; }

    app.import('vendor/qunit-proxy-fixtures.js', {
      type: 'test'
    });
    app.import(app.bowerDirectory + '/jquery-mockjax/jquery.mockjax.js', {
      type: 'test'
    });
  },

  serverMiddleware: function(options) {
    if(!this.validEnv()) { return; }

    this.project.liveReloadFilterPatterns.push('tests/fixtures/proxy');
    this.middleware(options.app, options.options);
  },

  middleware: function(app, options) {
    options.srcDir = path.join(this.project.root, 'tests/fixtures/proxy');
    app.use(bodyParser.json());
    app.use(middleware(options));
  },

  testemMiddleware: function(app) {
    if(!this.validEnv()) { return; }

    this.middleware(app, {});
  },

  postprocessTree: function(type, tree) {
    if(!this.validEnv()) { return tree; }

    this._requireBuildPackages();

    var treeTestLoader = this.pickFiles(tree, {
      files: ['test-loader.js'],
      srcDir: 'assets',
      destDir: 'app'
    });

    var lib = this.treeGenerator(path.join(__dirname, 'lib'));
    var proxyTestLoader = this.pickFiles(lib, {
      files: ['test-loader.js'],
      srcDir: '/',
      destDir: 'proxy'
    });

    var testLoaderTree = this.concatFiles(this.mergeTrees([treeTestLoader, proxyTestLoader]), {
      inputFiles: ['**/*.js'],
      outputFile: '/assets/test-loader.js'
    });

    return this.mergeTrees([tree, testLoaderTree], {
      overwrite: true
    });
  }
};
