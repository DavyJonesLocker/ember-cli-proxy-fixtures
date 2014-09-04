'use strict';

var fs     = require('fs');
var path   = require('path');
var mkdirp = require('mkdirp');
var url    = require('url');

module.exports = function(options) {
  var fixtures;
  var srcDir = options.srcDir;

  return function(req, res, next) {
    var write = res.write;
    res.write = function(body) {
      addFixture(this, body.toString());
      return write.apply(this, arguments);
    };

    if (req.method === 'POST' && req.url === '/write-fixtures') {
      writeFixtures();
    } else if (req.method === 'DELETE' && req.url === '/clear-fixtures') {
      clearFixtures();
    } else {
      delete req.headers['if-none-match'];
      return next();
    }

    return res.end();

    function clearFixtures() {
      fixtures = {};
    };

    function writeFixtures() {
      var output;
      for (var moduleName in fixtures) {
        for (var testName in fixtures[moduleName]) {
          mkdirp.sync(path.join(srcDir, moduleName));
          output = JSON.stringify(fixtures[moduleName][testName], null, 2);
          fs.writeFileSync(path.join(srcDir, moduleName, testName + '.json'), output);
        }
      }
    };

    function addFixture (res, body) {
      var moduleName = req.headers['x-module-name'];
      var testName   = req.headers['x-test-name'];
      var method     = res.req.method.toLowerCase();
      var parsedUrl  = url.parse(res.req.url);
      var pathname   = parsedUrl.pathname;
      var query      = parsedUrl.query || '';

      if (moduleName && testName) {
        var fixture = {
          statusCode: res.statusCode,
          headers: {},
          body: body
        };

        for (var headerKey in res._headers) {
          fixture.headers[res._headerNames[headerKey]] = res._headers[headerKey];
        }

        fixtures[moduleName]                                    = fixtures[moduleName]                                    || {};
        fixtures[moduleName][testName]                          = fixtures[moduleName][testName]                          || {};
        fixtures[moduleName][testName][pathname]                = fixtures[moduleName][testName][pathname]                || {};
        fixtures[moduleName][testName][pathname][method]        = fixtures[moduleName][testName][pathname][method]        || {};
        fixtures[moduleName][testName][pathname][method][query] = fixtures[moduleName][testName][pathname][method][query] || {
          fixtures: [],
          offset: 0
        };

        fixtures[moduleName][testName][pathname][method][query].fixtures.push(fixture);
      }
    };
  };
};
