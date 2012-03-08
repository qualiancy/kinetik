var chai = require('chai')
  , should = chai.should()
  , Seed = require('seed')
  , spies = require('chai-spies')

chai.use(spies);

var kinetik = require('..');

describe('tasks', function () {

  describe('basic configuration', function() {
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

  describe('execution', function () {

    it('should emit success for each successful execution', function (done) {
      var store = new Seed.MemoryStore
        , queue = kinetik.createQueue({ store: store })
        , spy = chai.spy();

      queue
        .define('task success')
        .tag('task success')
        .on('completed', function (job) {
          job.get('task').should.equal('task success');
          job.get('data').should.eql({ hello: 'universe' });
          job.get('status').should.equal('completed');
          should.not.exist(job.get('error'));
          spy.should.have.been.called.once;
          done();
        })
        .action(function (job, next) {
          spy();
          process.nextTick(next);
        });

      queue.create('task success', { hello: 'universe' });
      queue.process([ 'task success' ]);
    });

    it('should emit error for each failed execution', function (done) {
      var store = new Seed.MemoryStore
        , queue = kinetik.createQueue({ store: store })
        , spye = chai.spy();

      queue
        .define('task error')
        .tag('task error')
        .on('error', function (job, err) {
          job.get('data').should.eql({ hello: 'universe' });
          job.get('task').should.equal('task error');
          job.get('error').should.equal('bad formatting');
          job.get('status').should.equal('failed');
          err.should.be.instanceof(Error);
          err.message.should.equal('bad formatting');
          spye.should.have.been.called.once;
          done();
        })
        .action(function (job, next) {
          spye();
          process.nextTick(function () {
            next(new Error('bad formatting'));
          });
        });

      queue.create('task error', { hello: 'universe' });
      queue.process([ 'task error' ]);
    });
  });
});
