var chai = require('chai')
  , chaiSpies = require('chai-spies')
  , should = chai.should()
  , Seed = require('seed');

chai.use(chaiSpies);

function loadCov (which) {
  return process.env.KINETIK_COV
    ? require('../lib-cov/kinetik/' + which)
    : require('../lib/kinetik/' + which);
}

var kinetik = require('..')
  , Task = loadCov('seed/task.model')
  , Job = loadCov('seed/job.model');

describe('queue', function () {

  describe('constuction', function () {

    it('will default to using a memorystore', function () {
      var queue = kinetik();
      queue._store.should.be.instanceof(Seed.MemoryStore);
    });

    it('can use a custom store', function () {
      var store = new Seed.MemoryStore();
      store.__testing = 'hello universe';
      var queue = kinetik(store);
      queue._store.should.deep.equal(store);
    });

    it('can use a custom interval', function () {
      var queue = kinetik({ interval: 500 });
      queue._opts.should.have.property('interval', 500);
    });

  });

  describe('middleware', function () {
    var queue;

    before(function () {
      queue = kinetik();
    });

    it('can be configured by node env', function () {
      var env = process.env.NODE_ENV; // storing current
      process.env.NODE_ENV = 'test';

      queue.configure(function () { queue.__noenv = true ; });
      queue.configure('test', function () { queue.__testenv = true; });
      queue.configure('production', function () { queue.__prodenv == true; });

      queue.should.have.property('__noenv', true);
      queue.should.have.property('__testenv', true);
      queue.should.not.have.property('__prodenv');

      process.env.NODE_ENV = env; // resetting current
    });

    it('can be used by function', function () {
      var queue = kinetik()
        , spy = chai.spy(function (_queue) {
            _queue.should.deep.equal(queue);
          });

      queue.use(spy);
      spy.should.have.been.called.once;
    });

    it('can be used by object with `handle`', function () {
      var queue = kinetik()
        , spy = chai.spy(function (_queue) {
            _queue.should.deep.equal(queue);
          })
        , middleware = { handle: spy };

      queue.use(middleware);
      spy.should.have.been.called.once;
    });

  });

  describe('job management', function () {
    var queue
      , task1
      , task2
      , job1
      , job2
      , job3;

    before(function (done) {
      queue = kinetik();
      task1 = queue.define('task::1').tag('one');
      task2 = queue.define('task::2').tag('two');
      job1 = queue.create('task::1');
      job2 = queue.create('task::2');
      job3 = queue.create('task::2');
      queue.once('drain', done);
    });

    it('can fetch jobs', function (done) {
      queue.fetch({ status: 'queued' }, function (err, jobs) {
        should.not.exist(err);
        jobs.should.be.instanceof(Seed.Hash);
        jobs.should.have.length(3);
        done();
      });
    });

    it('can get a list of tags', function () {
      queue.tags.should.be.instanceof(Array);
      queue.tags.should.have.length(2);
      queue.tags.should.include('one', 'two');
    })

    it('can cancel a job by job model', function (done) {
      var spy = chai.spy(function (job) {
        job.should.deep.equal(job1);
      });

      task1.on('cancelled', spy);
      job1.get('status').should.equal('queued');
      queue.cancel(job1, function (err) {
        should.not.exist(err);
        job1.get('status').should.equal('cancelled');
        spy.should.have.been.called.once;
        task1.off('cancelled', spy);
        done();
      });
    });

    it('can cancel a job by job id', function (done) {
      var spy = chai.spy(function (job) {
        job.id.should.equal(job2.id);
      });

      task2.on('cancelled', spy);
      job2.get('status').should.equal('queued');
      queue.cancel(job2.id, function (err) {
        if (err) throw err;
        should.not.exist(err);
        spy.should.have.been.called.once;
        task2.off('cancelled', spy);
        job2.fetch(function (err) {
          should.not.exist(err);
          job2.get('status').should.equal('cancelled');
          done();
        });
      });
    });

    xit('', function (done) {
      queue.clean('one', function (err) {
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


    xit('should allow for all tags to be cleaned', function (done) {
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

  xdescribe('cleaning', function () {
    var store = new Seed.MemoryStore()
      , queue = kinetik.createQueue(store, { interval: 50 });

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

      queue.on('empty', function flush () {
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


  });

});
