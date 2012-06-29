var chai = require('chai')
  , chaiSpies = require('chai-spies')
  , should = chai.should();

chai.use(chaiSpies);

var kinetik = require('../..')
  , Seed = require('seed');

module.exports = function (store) {
  var queue;

  before(function () {
    queue = kinetik(store, { interval: 30 });
  });

  it('can have a custom store defined', function () {
    should.exist(queue._store);
    queue._store.should.be.instanceof(Seed.Store);
    queue._store.should.deep.equal(store);
  });

  it('can define jobs', function (done) {
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

  it('can emit success for successful execution', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          process.nextTick(next);
        });

    queue
      .define('task success')
      .tag('task success')
      .on('completed', function (job) {
        job.get('task').should.equal('task success');
        job.get('data').should.deep.equal(data);
        job.get('status').should.equal('completed');
        should.not.exist(job.get('error'));
        spy.should.have.been.called.once;
        done();
      })
      .action(spy);

    queue.create('task success', data);
    queue.process([ 'task success' ]);
  });

  it('can clean successfully completed jobs', function (done) {
    queue.fetch({ status: 'completed' }, function (err, jobs) {
      should.not.exist(err);
      jobs.should.have.length(1);
      queue.clean(function (err) {
        should.not.exist(err);
        queue.fetch({ status: 'completed' }, function (err, validate) {
          should.not.exist(err);
          validate.should.have.length(0);
          done();
        });
      });
    });
  });

  it('can emit error for failed execution', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          process.nextTick(function () {
            var err = new Error('bad formatting');
            err.code = 'EBADFORMATTING';
            next(err);
          });
        });

    var task = queue
      .define('task fail')
      .tag('task fail')
      .on('fail', function (err, job) {
        job.get('data').should.deep.equal(data);
        job.get('task').should.equal('task fail');
        job.get('error').should.deep.equal({
            message: 'bad formatting'
          , code: 'EBADFORMATTING'
        });
        job.get('status').should.equal('failed');
        err.should.be.instanceof(Error);
        err.message.should.equal('bad formatting');
        spy.should.have.been.called.once;
        done();
      })
      .action(spy);

    queue.create('task fail', data);
    queue.process([ 'task fail' ]);
  });

  it('can emit timeout for timed out exectution', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          // not calling done
        });

    var task = queue
      .define('task timeout')
      .tag('task timeout')
      .timeout(50)
      .on('timeout', function (job) {
        job.get('data').should.deep.equal(data);
        job.get('task').should.equal('task timeout');
        job.get('status').should.equal('timeout');
        spy.should.have.been.called.once;
        done();
      })
      .action(spy);

    queue.create('task timeout', data);
    queue.process([ 'task timeout' ]);
  });

  it('can emit progress for a multistep job', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          job.should.have.property('progress').a('function');
          var arr = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
          Seed.async.forEachSeries(arr, function (n, cb) {
            setTimeout(function () {
              job.progress(n, arr.length);
              cb();
            }, 10);
          }, next);
        })
      , log = chai.spy(function (job, curr, total) {
          curr.should.be.a('number').below(11);
          total.should.equal(10);
        });

    var task = queue
      .define('task progress')
      .tag('task progress')
      .on('progress', log)
      .on('completed', function (job) {
        log.should.have.been.called.exactly(10);
        done();
      })
      .action(spy);

    queue.create('task progress', data);
    queue.process([ 'task progress' ]);
  });

  it('can emit log on log write', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          job.should.have.property('log').a('function');
          var arr = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];
          Seed.async.forEachSeries(arr, function (n, cb) {
            setTimeout(function () {
              job.log('working on ' + n);
              cb();
            }, 10);
          }, next);
        })
      , log = chai.spy(function (job, log) {
          log.should.be.an('object');
          log.type.should.equal('log');
          log.get('message').should.be.a('string');
        });

    var task = queue
      .define('task log')
      .tag('task log')
      .on('log', log)
      .on('completed', function (job) {
        log.should.have.been.called.exactly(12);
        done();
      })
      .action(spy);

    queue.create('task log', data);
    queue.process([ 'task log' ]);
  });

  it('can clean multiple tags of multiple statuses', function (done) {
    var tags = [ 'task fail', 'task timeout', 'task progress', 'task log' ]
      , status = [ 'failed', 'timeout', 'completed' ]
      , query = { status: { $in: status }, task: { $in: tags } }
    queue.fetch(query, function (err, jobs) {
      should.not.exist(err);
      jobs.should.have.length(4);
      queue.clean({ tags: tags , status: status }, function (err) {
        should.not.exist(err);
        queue.fetch(query, function (err, validate) {
          should.not.exist(err);
          validate.should.have.length(0);
          done();
        });
      });
    });
  });
};
