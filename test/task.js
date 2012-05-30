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

});
