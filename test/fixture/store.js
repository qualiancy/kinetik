var chai = require('chai')
  , should = chai.should();

var kinetik = require('../..');

var Seed = require('seed');

module.exports = function (store) {
  var queue;

  before(function () {
    queue = kinetik.createQueue({
        interval: 50
      , store: store
    });
  });

  it('should have a store defined', function () {
    should.exist(queue._store);
    queue._store.should.be.instanceof(Seed.Store);
    queue._store.should.deep.equal(store);
  });

  it('should be able to define jobs', function (done) {
    queue.create('task:1', {
        test: true
      , hello: 'universe'
    });

    queue.once('drain', function () {
      queue.fetch({ status: 'queued' }, function (err, jobs) {
        should.not.exist(err);
        jobs.should.have.length(1);
        done();
      });
    });
  });

};
