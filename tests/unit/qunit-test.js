var assert        = require('assert');
var sinon         = require('sinon');
var proxyFixtures = require('../../lib/qunit');

describe('QUnit Injection', function() {
  before(function() {
    resetGlobals();
  });

  describe('calls QUnit lifecycle methods', function() {
    var spy;
    beforeEach(function() {
      spy = sinon.spy();
    });

    ['testStart', 'testDone', 'begin', 'done'].forEach(function(method) {
      it(method, function() {
        QUnit[method] = spy;
        proxyFixtures('proxyFixtures');
        assert(spy.called);
      });
    });
  });

  describe('$.ajaxSetup', function() {
    var testStart, testDone, spy, details;
    beforeEach(function() {
      QUnit.begin     = function(fn) { fn(); return this; };
      QUnit.testStart = function(fn) { testStart = fn.bind(this); }
      QUnit.testDone  = function(fn) { testDone = fn.bind(this); }

      spy               = sinon.spy();
      Ember.$.ajaxSetup = spy;
      proxyFixtures('proxyFixtures');

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
  global.Ember = {
    '$': {
      ajax: function(options) { return jqPromiseProxy(); }
    }
  };
  global.Pretender = null;
  global.window = {};
}

