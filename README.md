# Ember CLI Proxy Fixtures

## About ##

Capture Ember CLI proxy server responses for faster playback on the
second run.

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
