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

    it('add ajaxSuccess listener');
    it('returns early without fixture data');

    describe('mockjax setup', function() {
      describe('return early', function() {
        it('url path doesn\'t match');
        it('method doesn\'t match');
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
    it('properly escapes a string');
  });

  describe('#cacheRequest', function() {
    describe('returns early', function() {
      it('without x-module-name and x-test-name headers');
      it('with x-mockjax-response === \'true\'');
    });

    it('adds valid request to cachedRequests');
  });

  describe('#parseUrl', function() {
    it('full url');
    it('path');
    it('query');
  });

  describe('#headerStringToObject', function() {
    it('returns proper object');
  });
});
