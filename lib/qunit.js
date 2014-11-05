var escape = function escape(str) {
  return str.replace(/'/g, "\\'");
}

var cacheRequest = function cacheRequest(e, xhr, settings) {
  if(!settings.headers || !settings.headers['x-module-name'] || !settings.headers['x-test-name']) {
    return;
  }

  var headers = headerStringToObject(xhr.getAllResponseHeaders());

  // This prevents mocked requests from being re-saved
  if(headers['x-mockjax-response'] === 'true') {
    return;
  }

  var cachedRequest = {
    url:         settings.url,
    statusCode:  xhr.status,
    method:      settings.type,
    reqHeaders:  settings.headers,
    headers:     headers,
    body:        JSON.parse(xhr.responseText.length > 1 ? xhr.responseText : '{}')
  };

  cachedRequests.push(cachedRequest);
}

var parseUrl = function parseUrl(url) {
  var urlParts = url.toString().split('?');

  return {
    url:    url,
    path:   urlParts[0],
    query:  urlParts[1] || ''
  };
}

var headerStringToObject = function headerStringToObject(headers) {
  return Ember.A(headers.split(/\r\n|\n/)).reduce(function(acc, str) {
    var split = str.split(':');
    var key   = split[0];
    var value = split[1];

    if(key && value) {
      acc[key.trim()] = value.trim();
    }

    return acc;
  }, {});
}

var proxyFixtures = function proxyFixtures(name) {
  var proxyFixtures = window[name];
  var useProxyFixtures = false;
  var cachedRequests = [];

  QUnit.testStart(function(details) {
    if (useProxyFixtures) {
      Ember.$.ajaxSetup({
        headers: {
          'x-module-name': details.module,
          'x-test-name':   details.name
        }
      });

      Ember.$(document).on('ajaxSuccess', cacheRequest);

      var proxyFixtures = window[name];
      if (proxyFixtures && proxyFixtures[details.module] && proxyFixtures[details.module][details.name]) {
        var fixtures = proxyFixtures[details.module][details.name];

        Ember.keys(fixtures).forEach(function(fixtureUrl) {
          Ember.keys(fixtures[fixtureUrl]).forEach(function(method){
            Ember.$.mockjax(function(settings) {
              var url = parseUrl(settings.url);
              var settingsMethod = settings.method || settings.type;

              if(url.path === fixtureUrl && settingsMethod.toLowerCase() === method.toLowerCase()) {
                var path  = url.path;
                var query = '';

                if(settingsMethod === 'GET') {
                  if(settings.data) {
                    query = Ember.$.param(settings.data)
                  } else {
                    query = url.query;
                  }
                }

                var proxyFixtures = window[name];
                var fixtures      = proxyFixtures[escape(details.module)][escape(details.name)];
                var fixture       = fixtures[path][method][query].fixtures[fixtures[path][method][query].offset];
                fixtures[path][method][query].offset += 1;

                fixture.headers['x-mockjax-response'] = 'true';

                return {
                  responseTime:  0,
                  method:        settingsMethod,
                  headers:       fixture.headers,
                  responseText:  JSON.parse(fixture.body)
                }
              }

              return false;
            });
          });
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

      Ember.$(document).off('ajaxSuccess', cacheRequest);
      Ember.$.mockjax.clear();
    }
  });

  QUnit.config.autostart = false;
  QUnit.begin(function() {
    Ember.$.ajax({
      type: 'DELETE',
      url: 'clear-fixtures'
    }).done(function() {
      useProxyFixtures = true;
      cachedRequests   = [];
    }).always(function() {
      QUnit.start();
    });
  });

  QUnit.done(function() {
    if (useProxyFixtures) {
      Ember.$.ajax({
        type:         'POST',
        url:          'write-fixtures',
        contentType:  'application/json',
        dataType:     'json',
        data:         JSON.stringify(cachedRequests)
      });
    }
  });

};

QUnit.proxyFixtures = proxyFixtures;
if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  exports.proxyFixtures        = proxyFixtures;
  exports.escape               = escape;
  exports.parseUrl             = parseUrl;
  exports.cacheRequest         = cacheRequest;
  exports.headerStringToObject = headerStringToObject;
}
