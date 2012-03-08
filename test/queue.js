var chai = require('chai')
  , should = chai.should()
  , Seed = require('seed')
  , spies = require('chai-spies')

chai.use(spies);

var kinetik = require('..');

describe('queue', function () {

  it('should be an event emitter', function (done) {
    var queue = kinetik.createQueue();
    queue.on('test', function (obj) {
      obj.should.eql({ hello: 'universe' });
      done()
    });
    queue.emit('test', { hello: 'universe' });
  });

  it('should accept the interval option', function () {
    var queue = kinetik.createQueue({ interval: 500 });
    queue.interval.should.equal(500);
  });

  it('should accept a store', function () {
    var store = new Seed.MemoryStore()
      , queue = kinetik.createQueue({ store: store });

    queue._store.should.be.instanceof(Seed.MemoryStore);
    queue._store.should.eql(store);
    queue._processor.store.should.be.instanceof(Seed.MemoryStore);
    queue._processor.store.should.eql(store);
  });

});
