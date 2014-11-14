function ProxyFixtures(name) {
  this.name             = name;
  this.fixtures         = window[name];
  this.useProxyFixtures = false;
  this.cachedRequests   = [];
}

ProxyFixtures.prototype.hookIntoQUnit = function() {
  QUnit.testStart(this.testStart.bind(this));
  QUnit.testDone(this.testDone.bind(this));
  QUnit.begin(this.begin.bind(this));
  QUnit.done(this.done.bind(this));

  QUnit.config.autostart = false;
};

ProxyFixtures.prototype.begin = function() {
  var instance = this;

  Ember.$.ajax({
    type: 'DELETE',
    url: 'clear-fixtures'
  }).done(function() {
    instance.useProxyFixtures = true;
    instance.cachedRequests   = [];
  }).always(function() {
    QUnit.start();
  });
};

ProxyFixtures.prototype.done = function() {
  if (!this.useProxyFixtures) {
    return;
  }

  Ember.$.ajax({
    type:         'POST',
    url:          'write-fixtures',
    contentType:  'application/json',
    dataType:     'json',
    data:         JSON.stringify(this.cachedRequests)
  });
};

ProxyFixtures.prototype.testStart = function(details) {
  var instance = this;

  if (!instance.useProxyFixtures) {
    return;
  }

  Ember.$.ajaxSetup({
    headers: {
      'x-module-name': details.module,
      'x-test-name':   details.name
    }
  });

  Ember.$(document).on('ajaxSuccess',
                        instance.cacheRequest.bind(instance));

  var proxyFixtures = window[instance.name];

  if (!proxyFixtures || !proxyFixtures[details.module] || !proxyFixtures[details.module][details.name]) {
    return;
  }

  var fixtures = proxyFixtures[details.module][details.name];

  Ember.keys(fixtures).forEach(function(fixtureUrl) {
    Ember.keys(fixtures[fixtureUrl]).forEach(function(method){
      Ember.$.mockjax(function(settings) {
        var url = instance.parseUrl(settings.url);
        var settingsMethod = settings.method || settings.type;

        if(url.path !== fixtureUrl || settingsMethod.toLowerCase() !== method.toLowerCase()) {
          return false;
        }

        var path  = url.path;
        var query = '';

        if(settingsMethod === 'GET') {
          if(settings.data) {
            query = Ember.$.param(settings.data)
          } else {
            query = url.query;
          }
        }

        var proxyFixtures = window[instance.name];
        var fixtures      = proxyFixtures[instance.escape(details.module)][instance.escape(details.name)];
        var fixture       = fixtures[path][method][query].fixtures[fixtures[path][method][query].offset];
        fixtures[path][method][query].offset += 1;

        fixture.headers['x-mockjax-response'] = 'true';

        return {
          responseTime:  0,
          method:        settingsMethod,
          headers:       fixture.headers,
          responseText:  JSON.parse(fixture.body)
        }
      });
    });
  });
};

ProxyFixtures.prototype.testDone = function() {
  if (!this.useProxyFixtures) {
    return;
  }

  Ember.$.ajaxSetup({
    headers: {
      'x-module-name': undefined,
      'x-test-name': undefined
    }
  });

  Ember.$(document).off('ajaxSuccess', this.cacheRequest.bind(this));
  Ember.$.mockjax.clear();
};

ProxyFixtures.prototype.escape = function(str) {
  return str.replace(/'/g, "\\'");
};

ProxyFixtures.prototype.cacheRequest = function(e, xhr, settings) {
  if(!settings.headers || !settings.headers['x-module-name'] || !settings.headers['x-test-name']) {
    return;
  }

  var headers = this.headerStringToObject(xhr.getAllResponseHeaders());

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

  this.cachedRequests.push(cachedRequest);
};

ProxyFixtures.prototype.parseUrl = function(url) {
  var urlParts = url.toString().split('?');

  return {
    url:    url,
    path:   urlParts[0],
    query:  urlParts[1] || ''
  };
};

ProxyFixtures.prototype.headerStringToObject = function(headers) {
  return Ember.A(headers.split(/\r\n|\n/)).reduce(function(acc, str) {
    var split = str.split(':');
    var key   = split[0];
    var value = split[1];

    if(key && value) {
      acc[key.trim()] = value.trim();
    }

    return acc;
  }, {});
};

QUnit.ProxyFixtures = ProxyFixtures;
if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = ProxyFixtures;
}
