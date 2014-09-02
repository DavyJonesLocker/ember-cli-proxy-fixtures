# Ember CLI Proxy Fixtures

## About ##

Capture Ember CLI proxy server responses for faster playback on the
second run.

This is only intended for use with the test suite. The idea is in some
cases you may be running your integration tests against a live server
taht is also running in its test environment. Making those requests,
even though it is local, can add up for a large integration suite.
Especially if you are blocking requests on database rollbacks and
fixture inserts. If you are controlling these via API endpoints on the
test server then you should see significant speed improvement from this
module.

## Install ##

```bash
npm install ember-cli-proxy-fixtures --save-dev
```

## Usage ##

You must start the ember app with a proxy in order to use the proxy
fixtures.

All proxy fixtures are saved to `tests/fixtures/proxy`. They will be namedspaced under a 
directory matching the module name for the test and each file name will
match the test itself. Contained within is the captured requests and the
recorded responses for playback.

The first time you run the test suite it will record all information
then write to the fixture files after the test suite is complete.
Multiple requests to the same endpoint for a test will be recorded
multiple times and played back via an offset. This module treats each
response as unique.

If you have made changes to the server and expect different response
simply run:

```
rm -rf tests/fixtures/proxy
```

No need to restart the server. Restart the test suite and all responses
will once again be recorded.

## Authors ##

* [Brian Cardarella](http://twitter.com/bcardarella)

[We are very thankful for the many contributors](https://github.com/dockyard/ember-cli-proxy-fixtures/graphs/contributors)

## Versioning ##

This library follows [Semantic Versioning](http://semver.org)

## Want to help? ##

Please do! We are always looking to improve this gem. Please see our
[Contribution Guidelines](https://github.com/dockyard/ember-cli-proxy-fixtures/blob/master/CONTRIBUTING.md)
on how to properly submit issues and pull requests.

## Legal ##

[DockYard](http://dockyard.com), Inc &copy; 2014

[@dockyard](http://twitter.com/dockyard)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)
