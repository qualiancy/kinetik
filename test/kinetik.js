var should = require('chai').should();

var kinetik = require('..');

describe('kinetik', function () {
  it('should have a valid version', function () {
    kinetik.version.should.match(/^\d+\.\d+\.\d+$/);
  });
});
