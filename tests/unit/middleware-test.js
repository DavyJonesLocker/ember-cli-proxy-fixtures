var fs      = require('fs');
var path    = require('path');
var tmp     = require('tmp-sync');

var middleware = require('../../lib/middleware');

describe('Middleware', function() {
  before(function() {
    this.tmpDir = tmp.in(__dirname);
    tmp.mark(this.tmpDir);

    this.options = { srcDir: this.tmpDir };

    this.readFixture = function(/* path, to file */) {
      var args = [].slice.call(arguments);

      var fixturePath = path.join.apply(path, [this.tmpDir].concat(args));

      return JSON.parse(fs.readFileSync(fixturePath, {
        encoding: 'utf8'
      }));
    }

    // This is all the
    this.proxyRequest = function(options) {
      var res = {
        end: noop, write: noop, _headers: {},
        req: { method: options.method, url: options.url },
        statusCode: options.statusCode
      };
      this.server({headers: {}}, res, noop);
      res.write.call({
        headers: options.headers
      }, JSON.stringify(options.body));
    };

    this.writeFixtures = function(body) {
      this.server({
        method: 'POST',
        url: '/write-fixtures',
        body: body || [],
      }, {end: noop}, noop);
    }

    this.clearFixtures = function() {
      this.server({
        method: 'DELETE',
        url: '/clear-fixtures'
      }, {end: noop}, noop);
    }
  });

  beforeEach(function() {
    this.server = middleware(this.options);
  });

  describe('POST /write-fixtures', function() {
    describe('writes fixtures', function() {
      describe('GET', function() {
        beforeEach(function() {
          this.writeFixtures([
            {
              reqHeaders: { 'x-module-name': 'test', 'x-test-name': 'test-get' },
              method: 'GET',
              url: '/users',
              statusCode: 200,
              headers: {},
              body: { users: [{id: 0}] }
            },
            {
              reqHeaders: { 'x-module-name': 'test', 'x-test-name': 'test-get' },
              method: 'GET',
              url: '/users?limit=0',
              statusCode: 200,
              headers: {},
              body: { users: [] }
            },
            {
              reqHeaders: { 'x-module-name': 'test', 'x-test-name': 'test-get' },
              method: 'GET',
              url: '/private-users',
              statusCode: 401,
              statusText: 'Unauthorized',
              headers: {},
              body: { users: [] }
            }
          ]);

          this.fixture = this.readFixture('test', 'test-get.json')
        });

        it('records with no query', function() {
          var fixture  = this.fixture['/users']['get'][''].fixtures[0];

          assert.deepEqual(Object.keys(fixture),
                          ['statusCode', 'headers', 'body']);

          assert.equal(fixture.statusCode, 200);
          assert.equal(fixture.body, '{"users":[{"id":0}]}');
          assert.deepEqual(fixture.headers, {});

        });

        it('records with query', function() {
          var fixture  = this.fixture['/users']['get']['limit=0'].fixtures[0];

          assert.deepEqual(Object.keys(fixture),
                          ['statusCode', 'headers', 'body']);

          assert.equal(fixture.statusCode, 200);
          assert.equal(fixture.body, '{"users":[]}');
          assert.deepEqual(fixture.headers, {});

        });
        
        it ('records an errored response', function () {
          var fixture = this.fixture['/private-users']['get'][''].fixtures[0];
          
          assert.deepEqual(Object.keys(fixture),
                          ['statusCode', 'statusText', 'headers', 'body']);
          assert.equal(fixture.statusCode, 401);
          assert.equal(fixture.statusText, "Unauthorized");
          assert.equal(fixture.body, '{"users":[]}');
          assert.deepEqual(fixture.headers, {});
        });
      });

      describe('POST', function() {
        beforeEach(function() {
          this.writeFixtures([{
            reqHeaders: { 'x-module-name': 'test', 'x-test-name': 'test-post' },
            method: 'POST',
            url: '/users',
            statusCode: 201,
            headers: { Authorization: 'Bearer 12345' },
            body: { user: { id: 0 } }
          }]);

          this.fixture = this.readFixture('test', 'test-post.json')
        });

        it('records with no query', function() {
          var fixture = this.fixture['/users']['post'][''].fixtures[0];

          assert.deepEqual(Object.keys(fixture),
                          ['statusCode', 'headers', 'body']);

          assert.equal(fixture.statusCode, 201);
          assert.equal(fixture.body, '{"user":{"id":0}}');
          assert.deepEqual(fixture.headers, {
            Authorization: 'Bearer 12345'
          });
        });
      });

      describe('PUT', function() {
        beforeEach(function() {
          this.writeFixtures([{
            reqHeaders: { 'x-module-name': 'test', 'x-test-name': 'test-put' },
            method: 'PUT',
            url: '/users/0',
            statusCode: 204,
            headers: { Authorization: 'Bearer 12345' },
            body: {}
          }]);

          this.fixture = this.readFixture('test', 'test-put.json')
        });

        it('records with no query', function() {
          var fixture = this.fixture['/users/0']['put'][''].fixtures[0];

          assert.deepEqual(Object.keys(fixture),
                          ['statusCode', 'headers', 'body']);

          assert.equal(fixture.statusCode, 204);
          assert.equal(fixture.body, '{}');
          assert.deepEqual(fixture.headers, {
            Authorization: 'Bearer 12345'
          });
        });
      });

      describe('DELETE', function() {
        beforeEach(function() {
          this.writeFixtures([{
            reqHeaders: { 'x-module-name': 'test', 'x-test-name': 'test-delete' },
            method: 'DELETE',
            url: '/users/0',
            statusCode: 204,
            headers: { Authorization: 'Bearer 12345' },
            body: {}
          }]);

          this.fixture = this.readFixture('test', 'test-delete.json')
        });

        it('records with no query', function() {
          var fixture = this.fixture['/users/0']['delete'][''].fixtures[0];

          assert.deepEqual(Object.keys(fixture),
                          ['statusCode', 'headers', 'body']);

          assert.equal(fixture.statusCode, 204);
          assert.equal(fixture.body, '{}');
          assert.deepEqual(fixture.headers, {
            Authorization: 'Bearer 12345'
          });
        });
      });
    });
  });

  describe('DELETE /clear-fixtures', function() {
    it('clears fixtures', function() {
      this.proxyRequest({
        method: 'GET', url: '/users', statusCode: 200,
        headers: { 'x-module-name': 'test', 'x-test-name': 'test-clear' },
        body: {users: []}
      });
      this.clearFixtures();
      this.writeFixtures();

      var fixturePath = path.join(this.tmpDir, 'test', 'test-clear.json');
      assert(!fs.existsSync(fixturePath), 'test-clear fixture should not be created');
    });
  });

  describe('proxy request', function() {
    beforeEach(function() {
      this.proxyRequest({
        method: 'GET',
        url: '/users',
        statusCode: 200,
        headers: { 'x-module-name': 'test', 'x-test-name': 'test-proxy' },
        body: {users: []}
      });
      this.writeFixtures();
    });

    it('hooks into res.write to intercept proxied requests', function() {
      var fixture = this.readFixture('test', 'test-proxy.json')['/users']['get'][''].fixtures[0];

      assert.deepEqual(Object.keys(fixture),
                      ['statusCode', 'headers', 'body']);

      assert.equal(fixture.statusCode, 200);
      assert.equal(fixture.body, '{"users":[]}');
      assert.deepEqual(fixture.headers, {});
    });
  });
});

function noop() { return this; }
