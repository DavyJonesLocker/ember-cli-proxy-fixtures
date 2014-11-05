// Sinon must be required prior to resetGloals being called. This is because
// resetGlobals sets the `window` object and sinon will pick it up and think
// it's in the browser
var sinon = require('sinon');

resetGlobals();
var assert        = require('assert');
var ProxyFixtures = require('../../lib/qunit');
var proxyFixtures;

describe('ProxyFixtures', function() {
  describe('QUnit injection', function() {
    describe('calls lifecycle methods on init', function() {
      var spy;
      beforeEach(function() {
        spy = sinon.spy();
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
      var spy, hookIntoQUnit;
      beforeEach(function() {
        spy               = sinon.spy();
        Ember.$.ajaxSetup = spy;

        hookIntoQUnit = sinon.stub(ProxyFixtures.prototype, 'hookIntoQUnit', noop);

        initProxyFixtures();
        proxyFixtures.useProxyFixtures = true;
      });

      afterEach(function() {
        hookIntoQUnit.restore();
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

function noop() { return this; }

function jqPromiseProxy() {
  return {
    done: function(fn) { fn(); return this; },
    always: function(fn) { fn(); return this; }
  }
};

function resetGlobals() {
  global.QUnit = {
    testStart: noop,
    testDone: noop,
    begin: noop,
    start: noop,
    done: noop,
    config: {}
  };

  global.$ = function() {
    return {
      on: noop,
      off: noop
    }
  };
  global.$.ajax = function(options) { return jqPromiseProxy(); }
  global.$.mockjax = noop;
  global.$.mockjax.clear = noop;

  global.Ember = {
    '$': global.$
  };

  global.window   = {};
  global.document = {};
}

function initProxyFixtures() {
  proxyFixtures = new ProxyFixtures('proxyFixtures');
}
