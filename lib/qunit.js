QUnit.proxyFixtures = function(name) {
  var server;
  var proxyFixtures = window[name];
  var useProxyFixtures = false;

  QUnit.testStart(function(details) {
    if (useProxyFixtures) {
      Ember.$.ajaxSetup({
        headers: {
          'x-module-name': details.module,
          'x-test-name':   details.name
        }
      });

      if (proxyFixtures && proxyFixtures[details.module] && proxyFixtures[details.module][details.name]) {
        var fixtures = proxyFixtures[details.module][details.name];

        server = new Pretender(function() {
          for (var path in fixtures) {
            for (var method in fixtures[path]) {
              this[method](path, function(request) {
                var fixture = fixtures[path][method].fixtures[fixtures[path][method].offset];
                fixtures[path][method].offset += 1;
                return [fixture.statusCode, fixture.headers, fixture.body];
              });
            }
          }
        });
      }
    }
  });

  QUnit.testDone(function() {
    if (useProxyFixtures) {
      Ember.$.ajaxSetup({
        headers: {
          'x-module-name': undefined,
          'x-test-name': undefined
        }
      });

      if (server) {
        server.shutdown();
      }
    }
  });

  QUnit.config.autostart = false;
  QUnit.begin(function() {
    Ember.$.ajax({
      type: 'DELETE',
      url: 'clear-fixtures'
    }).done(function() {
      useProxyFixtures = true;
    }).always(function() {
      QUnit.start();
    });
  });

  QUnit.done(function() {
    if (useProxyFixtures) {
      Ember.$.ajax({
        type: 'POST',
        url: 'write-fixtures'
      });
    }
  });
};
