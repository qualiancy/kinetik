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

  it('should allow for jobs to fetched', function (done) {
    var store = new Seed.MemoryStore()
      , queue = kinetik.createQueue({ store: store });

    queue.create('task:1', {
      hello: 'universe'
    });

    queue.create('task:2', {
      hello: 'world'
    });

    queue.once('drain', function () {
      queue.fetch({}, function (err, jobs) {
        should.not.exist(err);
        jobs.should.be.instanceof(Seed.Hash);
        jobs.should.have.length(2);
        jobs.each(function (value, key) {
          var name = value.get('task');
          [ 'task:1', 'task:2' ].indexOf(name).should.be.above(-1);
        });
        done();
      });
    });
  });

  describe('cleaning', function () {
    var queue = kinetik.createQueue({ store: new Seed.MemoryStore, interval: 50 });


    before(function (done) {
      queue
        .define('task 1')
        .tag('one')
        .action(function (job, next) {
          next();
        });

      queue
        .define('task 2')
        .tag('two')
        .action(function (job, next) {
          next();
        });

      queue
        .define('task 3')
        .tag('three')
        .action(function (job, next) {
          next();
        });

      queue.once('drain', function () {
        queue.process([ 'one', 'two', 'three' ]);
      });

      queue.on('flush', function flush () {
        queue.fetch({ status: 'completed' }, function (err, jobs) {
          should.not.exist(err);
          if (jobs.length == 6) {
            done();
            queue.off('flush', flush);
          }
        });
      });

      queue.create('task 1');
      queue.create('task 1');
      queue.create('task 2');
      queue.create('task 2');
      queue.create('task 3');
      queue.create('task 3');
    });

    it('should allow for a environment based configuration', function () {
      var env = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      queue.configure(function () {
        queue.testvar1 = 'test var 1';
      });

      queue.configure('test', function () {
        queue.testingvar = 'hello universe';
      });

      queue.configure('production', function () {
        queue.testvar1 == 'prod var';
      });

      queue.should.have.property('testvar1', 'test var 1');
      queue.should.have.property('testingvar', 'hello universe');
      process.env.NODE_ENV = env;
    });

    it('should allow us to get a list of all tags', function () {
      queue.tags.should.be.instanceof(Array);
      queue.tags.should.have.length(3);
      queue.tags.should.eql([ 'one', 'two', 'three' ]);
    });

    it('should allow for certain tags to be cleaned', function (done) {
      queue.clean([ 'one' ], function (err) {
        should.not.exist(err);
        queue.fetch({ status: 'completed' }, function (ferr, jobs) {
          should.not.exist(ferr);
          jobs.should.have.length(4);
          jobs.each(function (job) {
            job.get('task').should.not.equal('task 1');
          });
          done();
        });
      });
    })

    it('should allow for all tags to be cleaned', function (done) {
      queue.clean(function (err) {
        should.not.exist(err);
        queue.fetch({ status: 'completed' }, function (ferr, jobs) {
          should.not.exist(ferr);
          jobs.should.have.length(0);
          done();
        });
      });
    });
  });

});
