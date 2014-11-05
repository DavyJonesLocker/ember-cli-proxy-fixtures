resetGlobals();
var ProxyFixtures = require('../../lib/qunit');

var proxyFixtures;
function initProxyFixtures() {
  proxyFixtures = new ProxyFixtures('proxyFixtures');
}

describe('ProxyFixtures', function() {
  describe('QUnit injection', function() {
    describe('calls lifecycle methods on init', function() {
      var spy;
      beforeEach(function() {
        spy = this.sinon.spy();
      });

      ['testStart', 'testDone', 'begin', 'done'].forEach(function(method) {
        it('#' + method, function() {
          QUnit[method] = spy;
          initProxyFixtures();
          assert(spy.called);
        });
      });
    });

    describe('config', function() {
      beforeEach(function() {
        initProxyFixtures();
      });

      it('disables autostart', function() {
        assert(QUnit.config.autostart === false);
      });
    });
  });

  describe('#QUnitTestStart', function() {
    describe('$.ajaxSetup', function() {
      var spy;
      beforeEach(function() {
        spy               = this.sinon.spy();
        Ember.$.ajaxSetup = spy;

        this.sinon.stub(ProxyFixtures.prototype, 'hookIntoQUnit', noop);

        initProxyFixtures();
        proxyFixtures.useProxyFixtures = true;
      });

      it('sets headers on testStart', function() {
        var details = {
          module: 'Test',
          name: 'Works'
        };

        proxyFixtures.testStart(details);

        assert(spy.calledWith({
          headers: {
            'x-module-name': details.module,
            'x-test-name':   details.name
          }
        }));
      });

      it('resets headers on testDone', function() {
        proxyFixtures.testDone();

        assert(spy.calledWith({
          headers: {
            'x-module-name': undefined,
            'x-test-name':   undefined
          }
        }));
      });
    });
  });
});
