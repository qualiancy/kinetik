var should = require('chai').should()
  , Seed = require('seed')

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

  describe('options', function () {
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

  describe('tasks', function() {
    var queue = kinetik.createQueue({ store: new Seed.MemoryStore() })
      , task;

    it('should allow for for tasks to be defined', function () {
      task = queue.define('test task');
      task.should.be.instanceof(Seed.Model);
      task.get('name').should.equal('test task');
    });

    it('should be event emitters', function (done) {
      task.on('test event', function (obj) {
        obj.should.eql({ hello: 'universe' });
        done();
      });
      task.emit('test event', { hello: 'universe' });
    });

    describe('configuration', function () {
      it('should allow for tagging', function () {
        task.tag('test');
        task.get('tag').should.equal('test');
      });

      it('should allow for action definitions', function (done) {
        var fn = function () { done(); }
        task.action(fn);
        task.get('action').should.eql(fn);
        var action = task.get('action');
        action();
      });
    });
  });

  describe('jobs', function () {
    var queue = kinetik.createQueue({ store: new Seed.MemoryStore() });

    it('should allow for jobs to to be created', function () {
      var job = queue.create('task', { hello: 'universe' });
      job.should.be.instanceof(Seed.Model);
      job.get('status').should.equal('queued');
      job.get('data').should.eql({ hello: 'universe' });
      job.get('task').should.equal('task');
    });

    it('should able to be executed', function (done) {
      var i = 2;
      function after () {
        --i || done();
      }

      queue
        .define('test task')
        .tag('testing')
        .action(function (job, next) {
          job.should.have.property('data');
          job.data.should.eql({ hello: 'universe' });
          next();
          after();
        });

      queue.create('test task', { hello: 'universe' });
      queue.create('test task', { hello: 'universe' });
      queue.create('test task', { hello: 'universe' });

      queue.process([ 'testing' ]);
    });
  });

});
