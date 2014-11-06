resetGlobals();
var ProxyFixtures = require('../../lib/qunit');

var proxyFixtures;
describe('ProxyFixtures', function() {
  beforeEach(function() {
    proxyFixtures = new ProxyFixtures('proxyFixtures');
  });

  describe('QUnit injection', function() {
    describe('calls lifecycle methods on init', function() {
      beforeEach(function() {
        this.spy = this.sinon.spy();
      });

      ['testStart', 'testDone', 'begin', 'done'].forEach(function(method) {
        it('#' + method, function() {
          QUnit[method] = this.spy;

          proxyFixtures.hookIntoQUnit();

          assert(this.spy.called, 'QUnit.' + method + ' was not called');
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

  describe('#testStart', function() {
    beforeEach(function() {
      this.spy          = this.sinon.spy();
      Ember.$.ajaxSetup = this.spy;

      proxyFixtures.useProxyFixtures = true;
    });

    it('sets headers', function() {
      var details = {
        module: 'Test',
        name: 'Works'
      };

      proxyFixtures.testStart(details);

      assert(this.spy.calledWith({
        headers: {
          'x-module-name': details.module,
          'x-test-name':   details.name
        }
      }));
    });
  });

  describe('#testDone', function() {
    beforeEach(function() {
      this.spy          = this.sinon.spy();
      Ember.$.ajaxSetup = this.spy;

      proxyFixtures.useProxyFixtures = true;
    });

    it('resets headers', function() {
      proxyFixtures.testDone();

      assert(this.spy.calledWith({
        headers: {
          'x-module-name': undefined,
          'x-test-name':   undefined
        }
      }));
    });
  });
});
