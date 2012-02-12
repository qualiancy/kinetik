var Drip = require('drip')
  , Seed = require('seed')
  , RedisStore = require('seed-redis').Store
  , debug = require('debug')('queue')
  , util = require('util');

var Task = require('./task')
  , Job = require('./job')
  , Processor = require('./processor');

module.exports = Queue;

function Queue (options) {
  options = options || {};
  this.interval = options.interval || 50;
  this._store = options.store || new RedisStore(options.redis || {});
  this._tasks = new Seed.Hash(null, { findRoot: '_attributes' });
  this._processor = new Processor({
    store: this._store
  });
}

util.inherits(Queue, Drip);

Queue.prototype.use = function (fn) {
  this._stack.push(fn(this));
};

Queue.prototype.define = function (name) {
  var task = new Task;
  task.set({ 'name': name });
  this._tasks.set(name, task);
  return task;
};

Queue.prototype.create = function (task, data) {
  var attrs = {
      task: task
    , data: data
    , status: 'queued'
  };

  var job = new Job(attrs, { store: this._store });
  job.save();
};

Queue.prototype.process = function (tags) {
  var self = this;

  function next () {
    setTimeout(function () {
      self.process(tags);
    }, self.interval);
  }

  function iterate (i) {
    var tag = tags[i];
    if (!tag) return next();
    self.processTag(tag, function (filled) {
      if (!filled) return iterate(++i);
      self.process(tags);
    });
  }

  iterate(0);
};

Queue.prototype.processTag = function (tag, next) {
  var self = this
    , tasks = this._tasks.find({ 'tag': { $eq: tag }});

  function iterate (i) {
    var task = tasks.at(i);
    if (!task) return next(null);
    self.processTask(task, function (job) {
      if (!job) return iterate(++i);
      debug('found job %s', job.get('task'))
      job.process(task, function () {
        next(true);
      });
    });
  }

  iterate(0);
};

Queue.prototype.processTask = function (task, next) {
  var self = this
    , query = {
          'status': { $eq: 'queued' }
        , 'task' : { $eq: task.get('name') }
      };

  this._processor.flush();
  this._processor.fetch('job', query, function (err) {
    var jobs = self._processor.filter('job');
    if (jobs.length == 0) return next(null);
    next(jobs.at(0));
  });
};

