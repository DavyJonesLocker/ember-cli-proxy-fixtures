var fs         = require('fs');
var path       = require('path');
var mkdirp     = require('mkdirp');
var jsonConcat = require('broccoli-json-concat');
var pickFiles  = require('broccoli-static-compiler');
var fileMover  = require('broccoli-file-mover');
var concat     = require('broccoli-concat');
var mergeTrees = require('broccoli-merge-trees');
var middleware = require('./lib/middleware');

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

module.exports = {
  name: 'ember-cli-proxy-fixtures',
  treeFor: function(name) {
    if (name === 'vendor') {
      var proxyFixturesPath = path.join(this.app.project.root, 'tests/fixtures/proxy');
      if (!fs.existsSync(proxyFixturesPath)) {
        mkdirp.sync(proxyFixturesPath);
      }
      var proxyTree = jsonConcat(proxyFixturesPath, {
        outputFile: 'proxyFixtures.js',
        variableName: 'window.proxyFixtures'
      });

      var lib = unwatchedTree(path.join(__dirname, 'lib'));
      var qunit = pickFiles(lib, {
        files: ['qunit.js'],
        srcDir: '/',
        destDir: '/'
      });

      return concat(mergeTrees([proxyTree, qunit]), {
        inputFiles: ['**/*.js'],
        outputFile: '/qunit-proxy-fixtures.js'
      });
    }
  },
  included: function(app) {
    this.app = app;
    app.import('vendor/qunit-proxy-fixtures.js', {
      type: 'test'
    });
  },
  serverMiddleware: function(options) {
    this.project.liveReloadFilterPatterns.push('tests/fixtures/proxy');
    var app = options.app;
    options = options.options;

    if (options.proxy) {
      options.srcDir = path.join(this.project.root, 'tests/fixtures/proxy');
      app.use(middleware(options));
    }
  },
  postprocessTree: function(type, tree) {
    var treeTestLoader = pickFiles(tree, {
      files: ['test-loader.js'],
      srcDir: 'assets',
      destDir: 'app'
    });

    var lib = unwatchedTree(path.join(__dirname, 'lib'));
    var proxyTestLoader = pickFiles(lib, {
      files: ['test-loader.js'],
      srcDir: '/',
      destDir: 'proxy'
    });

    var testLoaderTree = concat(mergeTrees([treeTestLoader, proxyTestLoader]), {
      inputFiles: ['**/*.js'],
      outputFile: '/assets/test-loader.js'
    });
    return mergeTrees([tree, testLoaderTree], {
      overwrite: true
    });
  }
}
