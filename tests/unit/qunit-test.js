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
    });

    describe('useProxyFixtures === true', function() {
      beforeEach(function() {
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

    describe('useProxyFixtures === false', function() {
      beforeEach(function() {
        proxyFixtures.useProxyFixtures = false;
      });

      it('doesn\'t reset headers', function() {
        proxyFixtures.testDone();

        assert(!this.spy.called, 'ajaxSetup should not be called');
      });
    });
  });
});
