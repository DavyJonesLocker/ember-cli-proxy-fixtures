resetGlobals();
var ProxyFixtures = require('../../lib/qunit');

var proxyFixtures;
describe('ProxyFixtures', function() {
  beforeEach(function() {
    proxyFixtures = new ProxyFixtures('proxyFixtures');
  });

  describe('QUnit injection', function() {
    describe('calls lifecycle methods on init', function() {
      ['testStart', 'testDone', 'begin', 'done'].forEach(function(method) {
        it('#' + method, function() {
          QUnit[method] = this.sinon.spy();

          proxyFixtures.hookIntoQUnit();

          assert(QUnit[method].called, 'QUnit.' + method + ' was not called');
        });
      });
    });

    describe('config', function() {
      it('disables autostart', function() {
        assert(QUnit.config.autostart === false);
      });
    });
  });

  describe('#begin', function() {
    beforeEach(function() {
      QUnit.start = this.sinon.spy();
    });

    it('DELETE /clear-fixtures', function() {
      Ember.$.ajax = function(options) {
        assert.equal(options.type, 'DELETE');
        assert.equal(options.url, 'clear-fixtures');

        return jqPromiseProxy();
      }

      proxyFixtures.begin();
    });

    it('calls QUnit.start', function() {
      proxyFixtures.begin();

      assert(QUnit.start.called, 'QUnit.start was called');
    });

    it('sets useProxyFixtures to true', function() {
      assert(!proxyFixtures.useProxyFixtures)
      proxyFixtures.begin();
      assert(proxyFixtures.useProxyFixtures)
    });

    it('resets cachedRequests', function() {
      proxyFixtures.cachedRequests = [1,2,3];
      proxyFixtures.begin();
      assert.deepEqual(proxyFixtures.cachedRequests, [])
    });
  });

  describe('#done', function() {
    describe('useProxyFixtures === true', function() {
      beforeEach(function() {
        proxyFixtures.useProxyFixtures = true;
      });

      it('POST write-fixtures', function() {
        proxyFixtures.cachedRequests = [1];

        Ember.$.ajax = function(options) {
          assert.deepEqual(options, {
            type:         'POST',
            url:          'write-fixtures',
            contentType:  'application/json',
            dataType:     'json',
            data:         '[1]'
          });
        };

        proxyFixtures.done();
      });
    });

    describe('useProxyFixtures === false', function() {
      beforeEach(function() {
        proxyFixtures.useProxyFixtures = false;
      })

      it('returns early', function() {
        Ember.$.ajax = function() {
          assert(false, 'should not be called');
        };

        proxyFixtures.done();
      });
    });
  });

  describe('#testStart', function() {
    beforeEach(function() {
      var onSpy = this.onSpy = this.sinon.spy();
      Ember.$ = function() {
        return { on: onSpy };
      };
      Ember.$.ajaxSetup = this.sinon.spy();

      proxyFixtures.useProxyFixtures = true;
    });

    it('sets headers', function() {
      var details = {
        module: 'Test',
        name: 'Works'
      };

      proxyFixtures.testStart(details);

      assert(Ember.$.ajaxSetup.calledWith({
        headers: {
          'x-module-name': details.module,
          'x-test-name':   details.name
        }
      }));
    });

    it('add ajaxSuccess listener', function() {
      proxyFixtures.testStart({});

      var call = this.onSpy.getCall(0);

      assert.equal(call.args[0], 'ajaxSuccess')
      assert.equal(typeof call.args[1], 'function')
    });

    describe('returns early without fixture', function() {
      beforeEach(function() {
        Ember.keys = this.sinon.spy();
        this.details = {
          module: 'test',
          name: 'test'
        };
      });

      it('none', function() {
        window.proxyFixtures = undefined;
        proxyFixtures.testStart(this.details);

        assert(!Ember.keys.called, 'keys should not be called')
      });

      it('no module', function() {
        window.proxyFixtures = {};
        proxyFixtures.testStart(this.details);

        assert(!Ember.keys.called, 'keys should not be called')
      });

      it('no name', function() {
        window.proxyFixtures = {};
        window.proxyFixtures[this.details.module] = {};
        proxyFixtures.testStart(this.details);

        assert(!Ember.keys.called, 'keys should not be called')
      });
    });

    describe('mockjax setup', function() {
      describe('return early', function() {
        beforeEach(function() {
          Ember.$.mockjax = this.sinon.stub();
          Ember.keys = Object.keys;

          window.proxyFixtures = {
            'test': {
              'test': {
                'http://localhost:3000/api/v2/categories': {
                  'get': {
                    '': { }
                  }
                }
              }
            }
          };

          proxyFixtures.testStart({module: 'test', name: 'test'});

          var call       = Ember.$.mockjax.getCall(0);
          this.mockjaxFn = call.args[0];
        });

        it('url path doesn\'t match', function() {
          var res = this.mockjaxFn({url: 'http://localhost:3000/api/v2/users'});

          assert.equal(res, false);
        });

        it('method doesn\'t match', function() {
          var res = this.mockjaxFn({
            url: 'http://localhost:3000/api/v2/categories',
            method: 'POST'
          });

          assert.equal(res, false);
        });
      });

      describe('param parsing', function() {
        it('settings.data');
        it('not settings.data');
      });

      describe('valid request', function() {
        it('returns response');
      });
    });
  });

  describe('#testDone', function() {
    beforeEach(function() {
      var offSpy = this.offSpy = this.sinon.spy();
      Ember.$ = function() {
        return { off: offSpy };
      };
      Ember.$.mockjax = {};
      Ember.$.ajaxSetup = this.sinon.spy();
    });

    describe('useProxyFixtures === true', function() {
      beforeEach(function() {
        Ember.$.mockjax.clear          = this.sinon.spy();
        proxyFixtures.useProxyFixtures = true;
      });

      it('resets headers', function() {
        proxyFixtures.testDone();

        assert(Ember.$.ajaxSetup.calledWith({
          headers: {
            'x-module-name': undefined,
            'x-test-name':   undefined
          }
        }));
      });

      it('removes ajaxSuccess event handler', function() {
        proxyFixtures.testDone();

        var call = this.offSpy.getCall(0);

        assert.equal(call.args[0], 'ajaxSuccess')
        assert.equal(typeof call.args[1], 'function')
      });

      it('clears mockjax', function() {
        proxyFixtures.testDone();

        assert(Ember.$.mockjax.clear.called, 'mockjax.clear was not called');
      });
    });

    describe('useProxyFixtures === false', function() {
      beforeEach(function() {
        proxyFixtures.useProxyFixtures = false;
      });

      it('doesn\'t reset headers', function() {
        proxyFixtures.testDone();

        assert(!Ember.$.ajaxSetup.called, 'ajaxSetup should not be called');
      });
    });
  });

  describe('#escape', function() {
    it('escapes a \'', function() {
      var escaped = proxyFixtures.escape('It\'s doing something');
      assert.equal(escaped, 'It\\\'s doing something')
    });
  });

  describe('#cacheRequest', function() {
    describe('returns early', function() {
      beforeEach(function() {
        proxyFixtures.headerStringObject = this.sinon.spy();
        JSON.parse = this.sinon.spy();
      });

      it('without x-module-name and x-test-name headers', function() {
        proxyFixtures.cacheRequest(null, null, {})
        assert(!proxyFixtures.headerStringToObject.called,
               'headerStringToObject should not be called');
      });

      it('with x-mockjax-response === \'true\'', function() {
        proxyFixtures.cacheRequest(null, {
          getAllResponseHeaders: function() {
            return 'x-mockjax-response:true';
          },
          responseText: ''
        }, {
          headers: {
            'x-module-name': 'test',
            'x-test-name': 'test'
          }
        })

        assert(!JSON.parse.called, 'JSON.parse should not be called');
      });
    });

    it('adds valid request to cachedRequests', function() {
      assert.equal(proxyFixtures.cachedRequests.length, 0);

      proxyFixtures.cacheRequest(null, {
        getAllResponseHeaders: function() {
          return 'x-random-header:false';
        },
        responseText: '{"user":{"name":"Jake"}}',
        status: 200
      }, {
        url: 'http://localhost:4000/api/v1/users/1',
        type: 'GET',
        headers: {
          'x-module-name': 'test',
          'x-test-name': 'test'
        }
      });

      assert.equal(proxyFixtures.cachedRequests.length, 1);
      assert.deepEqual(proxyFixtures.cachedRequests[0], {
        url:         'http://localhost:4000/api/v1/users/1',
        statusCode:  200,
        method:      'GET',
        reqHeaders: {
          'x-module-name': 'test',
          'x-test-name': 'test'
        },
        headers: {
          'x-random-header': 'false'
        },
        body: {
          user: {
            name: 'Jake'
          }
        }
      });
    });
  });

  describe('#parseUrl', function() {
    it('full url', function() {
      var url    = 'http://localhost/api';
      var parsed = proxyFixtures.parseUrl(url);

      assert.equal(parsed.url, url);
    });

    describe('path', function() {
      it('with port', function() {
        var url    = 'http://localhost:3000/api';
        var parsed = proxyFixtures.parseUrl(url);

        assert.equal(parsed.path, url);
      });

      it('without port', function() {
        var url    = 'http://localhost/api';
        var parsed = proxyFixtures.parseUrl(url);

        assert.equal(parsed.path, url);
      });
    })

    describe('query', function() {
      it('is present', function() {
        var url    = 'http://localhost/api?test=1';
        var parsed = proxyFixtures.parseUrl(url);

        assert.equal(parsed.query, 'test=1');
      });

      it('not present', function() {
        var url    = 'http://localhost/api';
        var parsed = proxyFixtures.parseUrl(url);

        assert.equal(parsed.query, '');
      });
    });
  });

  describe('#headerStringToObject', function() {
    it('returns proper object', function() {
      var headerString = 'x-module-name:test\nother-thing:blah\r\nsomething:w';
      var parsed       = proxyFixtures.headerStringToObject(headerString);

      assert.deepEqual(parsed, {
        'x-module-name': 'test',
        'other-thing': 'blah',
        'something': 'w'
      });
    });
  });
});
