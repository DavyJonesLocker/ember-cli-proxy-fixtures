'use strict';

var fs     = require('fs');
var path   = require('path');
var mkdirp = require('mkdirp');
var zlib   = require('zlib');
var url    = require('url');

module.exports = function(options) {
  var fixtures = {};
  var srcDir = options.srcDir;

  return function(req, res, next) {
    var write = res.write;
    res.write = function(body) {
      if (res._headers['content-encoding'] === 'gzip') {
        var _this = this;
        zlib.unzip(body, function(err, body) {
          addFixtureFromProxy(_this, body.toString());
        });
      } else {
        addFixtureFromProxy(this, body.toString());
      }
      return write.apply(this, arguments);
    };

    if (req.method === 'POST' && req.url === '/write-fixtures') {
      if(req.body.length) {
        req.body.forEach(function(request) {
          var options = {
            moduleName: request.reqHeaders['x-module-name'],
            testName:   request.reqHeaders['x-test-name'],
            method:     request.method,
            url:        request.url,
            statusCode: request.statusCode,
            headers:    request.headers
          };
          addFixture(options, JSON.stringify(request.body));
        });
      }

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

    function addFixtureFromProxy(req, body) {
      if(!req.headers || !req.headers['x-module-name'] || !req.headers['x-test-name']) {
        return;
      }

      var options = {
        moduleName:  req.headers['x-module-name'],
        testName:    req.headers['x-test-name'],
        method:      res.req.method.toLowerCase(),
        url:         res.req.url,
        headers:     {}
      };

      if (moduleName && testName) {
        for (var headerKey in res._headers) {
          options.headers[res._headerNames[headerKey]] = res._headers[headerKey];
        }
      }

      return addFixture(options, body);
    }

    function addFixture (options, body) {
      var moduleName = options.moduleName;
      var testName   = options.testName;
      var method     = options.method.toLowerCase();
      var parsedUrl  = url.parse(options.url);
      var pathname   = url.format(parsedUrl).split('?')[0];
      var query      = parsedUrl.query || '';

      if (moduleName && testName) {
        var fixture = {
          statusCode: options.statusCode,
          headers: options.headers,
          body: body
        };

        delete fixture.headers['content-encoding'];

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

