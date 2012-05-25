var chai = require('chai')
  , should = chai.should()
  , Seed = require('seed')
  , spies = require('chai-spies')

chai.use(spies);

var kinetik = require('..');

describe('jobs', function () {

  it('should allow for jobs to to be created', function () {
    var queue = kinetik.createQueue({ store: new Seed.MemoryStore(), interval: 50  })
      , job = queue.create('task', { hello: 'universe' });
    job.should.be.instanceof(Seed.Model);
    job.get('status').should.equal('queued');
    job.get('data').should.eql({ hello: 'universe' });
    job.get('task').should.equal('task');
  });

  it('should able to be executed', function (done) {
    var queue = kinetik.createQueue({ store: new Seed.MemoryStore(), interval: 50 })

    var i = 2;
    function after () {
      --i || done();
    }

    queue
      .define('test task')
      .tag('testing')
      .action(function (job, next) {
        job.should.have.property('data');
        job.should.have.property('id');
        job.data.should.eql({ hello: 'universe' });
        after();
        next();
      });

    queue.create('test task', { hello: 'universe' });
    queue.create('test task', { hello: 'universe' });
    queue.create('test task', { hello: 'universe' });

    queue.process([ 'testing' ]);
  });

  it('should be able to be delayed', function (done) {
    var queue = kinetik.createQueue({ store: new Seed.MemoryStore(), interval: 50 })
      , spy = chai.spy();

    queue
      .define('delayed task')
      .tag('delayed')
      .action(function (job, next) {
        job.should.have.property('data');
        job.data.should.eql({ hello: 'universe' });
        spy.should.have.been.called.once;
        done();
      });

    queue.once('flush', spy);
    var job = queue.create('delayed task', { hello: 'universe' }, '0.3s');
    job.get('status').should.equal('delayed');
    job.get('delay').should.be.above(new Date().getTime());
    queue.process([ 'delayed' ]);
  });
});
