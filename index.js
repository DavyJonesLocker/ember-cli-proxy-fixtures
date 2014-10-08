var fs         = require('fs');
var path       = require('path');
var mkdirp     = require('mkdirp');
var jsonConcat = require('broccoli-json-concat');
var middleware = require('./lib/middleware');

module.exports = {
  name: 'ember-cli-proxy-fixtures',
  treeForVendor: function() {
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
    app.import('vendor/qunit-proxy-fixtures.js', {
      type: 'test'
    });
  },
  serverMiddleware: function(options) {
    this.project.liveReloadFilterPatterns.push('tests/fixtures/proxy');

    if (options.options.proxy) {
      this.middleware(options.app, options.options);
    }
  },
  middleware: function(app, options) {
    options.srcDir = path.join(this.project.root, 'tests/fixtures/proxy');
    app.use(middleware(options));
  },
  testemMiddleware: function(app) {
    this.middleware(app, {});
  },
  postprocessTree: function(type, tree) {
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
}
