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

        function escape(str) {
          return str.replace(/'/g, "\\'");
        }

        server = new Pretender(function() {
          for (var path in fixtures) {
            for (var method in fixtures[path]) {
              var code = "" +
                "var proxyFixtures = window['"+name+"'];\n" +
                "var query = Ember.$.param(request.queryParams);\n" +
                "var fixtures = proxyFixtures['"+escape(details.module)+"']['"+escape(details.name)+"'];\n" +
                "var fixture = fixtures['"+path+"']['"+method+"'][query].fixtures[fixtures['"+path+"']['"+method+"'][query].offset];\n" +
                "fixtures['"+path+"']['"+method+"'][query].offset += 1;\n" +
                "return [fixture.statusCode, fixture.headers, fixture.body];\n";
              var fn = new Function("server", "request", code);
              this[method](path, fn.bind("request", this));
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
