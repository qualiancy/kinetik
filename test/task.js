var chai = require('chai')
  , chaiSpies= require('chai-spies')
  , should = chai.should()
  , Seed = require('seed');

chai.use(chaiSpies);

function loadCov (which) {
  return process.env.KINETIK_COV
    ? require('../lib-cov/kinetik/' + which)
    : require('../lib/kinetik/' + which);
}

var Task = loadCov('seed/task.model');

describe('task models', function () {
  var task;

  before(function () {
    task = new Task({ name: 'Task' });
  });

  it('have a name', function () {
    task.get('name').should.equal('Task');
  });

  it('can be tagged', function () {
    task.should.respondTo('tag');
    task.tag('test');
    task.get('tag').should.equal('test');
  });

  it('can have a timeout set', function () {
    task.should.respondTo('timeout');
    task.timeout('1s');
    task.get('timeout').should.equal(1000);
  });

  it('can define an action', function () {
    task.should.respondTo('action');
    var spy = chai.spy();
    task.action(spy);
    task.get('action').should.eql(spy);
    var action = task.get('action');
    action();
    spy.should.have.been.called.once;
  });

  describe('#retry', function() {
    describe('retry(retryDelay, maxRetry)', function() {
      before(function() {
        task.retry(1, 2);
      });

      it('sets retry to true', function() {
        task.get('retry').should.equal(true);
      });

      it('configures `maxRetry`', function() {
        task.get('maxRetry').should.equal(2);
      });

      it('configures `retryDelay`', function() {
        task.get('retryDelay').should.equal(1);
      });
    });

    describe('retry(options)', function() {
      before(function() {
        task.retry({ retryDelay: 1, maxRetry: 2 });
      });

      it('sets retry to true', function() {
        task.get('retry').should.equal(true);
      });

      it('configures `maxRetry`', function() {
        task.get('maxRetry').should.equal(2);
      });

      it('configures `retryDelay`', function() {
        task.get('retryDelay').should.equal(1);
      });
    });
  });
});
