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

var Job = loadCov('seed/job.model');

describe('job model', function () {
  var job
    , store;

  before(function () {
    store = new Seed.MemoryStore();
    job = new Job(null, { store: store });
  });

  it('can validate against the schema', function (done) {
    var job_data = {
        _id: 'abc123'
      , task: 'universe'
      , created: new Date().getTime()
      , status: 'queued'
    };

    job.merge(job_data);
    job.validate().should.be.true;
    job.save(function (err) {
      should.not.exist(err);
      job._attributes.should.deep.equal(job_data);
      done();
    });
  });

  it('can be cancelled', function (done) {
    job.get('status').should.equal('queued');
    job.cancel(function (err) {
      should.not.exist(err);
      job.get('status').should.equal('cancelled');
      done();
    });
  });

});
