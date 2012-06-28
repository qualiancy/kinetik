var chai = require('chai')
  , chaiSpies = require('chai-spies')
  , should = chai.should();

chai.use(chaiSpies);

var kinetik = require('../..')
  , Seed = require('seed');

module.exports = function (store) {
  var queue;

  before(function () {
    queue = kinetik.createQueue(store, { interval: 50 });
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

  it('should emit success for successful execution', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          //job.should.have.property('progress')
          //  .and.be.a('function');
          process.nextTick(next);
        });

    queue
      .define('task success')
      .tag('task success')
      .on('complete', function (job) {
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

  it('should emit error for failed execution', function (done) {
    var data = { hello: 'universe' }
      , spy = chai.spy(function (job, next) {
          job.should.be.an('object');
          job.should.have.property('id');
          job.should.have.property('data')
            .and.deep.equal(data);
          //job.should.have.property('progress')
          //  .and.be.a('function');
          process.nextTick(function () {
            var err = new Error('bad formatting');
            err.code = 'EBADFORMATTING';
            next(err);
          });
        });

    var task = queue
      .define('task error')
      .tag('task error')
      .on('error', function (err, job) {
        job.get('data').should.deep.equal(data);
        job.get('task').should.equal('task error');
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

    queue.create('task error', data);
    queue.process([ 'task error' ]);
  });
};
