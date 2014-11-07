var sinon = require('sinon');

global.assert = require('assert');

global.noop = function() { return this; }

global.requireFixture = function(fixture) {
  return require('./fixtures/' + fixture);
}

global.jqPromiseProxy = function() {
  return {
    done: function(fn) { fn(); return this; },
    always: function(fn) { fn(); return this; }
  }
};

global.resetGlobals = function() {
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
    '$': global.$,
    A: function(a) { return a; },
    keys: Object.keys
  };

  global.window   = {};
  global.document = {};
}

