GLOBAL.QUnit = {};
GLOBAL.Ember = {};
GLOBAL.Pretender = null;

var assert = require('assert');
var qunit = require('../../lib/qunit');

describe('QUnit Injection', function() {
  afterEach(function() {
    GLOBAL.QUnit = {};
  });

  after(function() {
    delete GLOBAL.QUnit;
    delete GLOBAL.Ember;
  });

  it('is true', function() {
    assert.equal(true, true);
  });
});
