// Sinon must be required prior to resetGloals being called. This is because
// resetGlobals sets the `window` object and sinon will pick it up and think
// it's in the browser
var sinon = require('sinon');

resetGlobals();
var assert        = require('assert');
var ProxyFixtures = require('../../lib/qunit');

describe('QUnit Injection', function() {
  describe('calls QUnit lifecycle methods', function() {
    var spy;
    beforeEach(function() {
      spy = sinon.spy();
    });

    ['testStart', 'testDone', 'begin', 'done'].forEach(function(method) {
      it(method, function() {
        QUnit[method] = spy;
        initProxyFixtures();
        assert(spy.called);
      });
    });
  });

  describe('$.ajaxSetup', function() {
    var testStart, testDone, spy, details;
    beforeEach(function() {
      QUnit.begin = function(fn) {
        // This fn must be called as the passed in fn called $.ajax which sets
        // useProxyFixtures to true which is required for all these tests to
        // work.
        fn();
        return this;
      };
      QUnit.testStart = function(fn) { testStart = fn.bind(this); }
      QUnit.testDone  = function(fn) { testDone = fn.bind(this); }

      spy               = sinon.spy();
      Ember.$.ajaxSetup = spy;
      initProxyFixtures();

      details = {
        module: 'Test',
        name: 'Works'
      };
    });

    it('sets headers on testStart', function() {
      testStart(details);

      assert(spy.calledWith({
        headers: {
          'x-module-name': details.module,
          'x-test-name':   details.name
        }
      }));
    });

    it('resets headers on testDone', function() {
      testDone();

      assert(spy.calledWith({
        headers: {
          'x-module-name': undefined,
          'x-test-name':   undefined
        }
      }));
    });
  });

  describe('QUnit config', function() {
    beforeEach(function() {
      initProxyFixtures();
    });

    it('disables autostart', function() {
      assert(QUnit.config.autostart === false);
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
  new ProxyFixtures('proxyFixtures');
}
