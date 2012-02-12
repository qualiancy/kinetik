/*!
 * chai
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Drip = require('drip')
  , Seed = require('seed')
  , RedisStore = require('seed-redis').Store
  , debug = require('debug')('queue')
  , util = require('util');

/*!
 * Local module dependancies
 */

var Task = require('./task')
  , Job = require('./job')
  , Processor = require('./processor');

/*!
 * Primary export
 */

module.exports = Queue;

/**
 * # Queue ([options])
 *
 * Queue constructor is the main interaction point for the
 * kinetik module. Accepts a number of options with sane defaults.
 *
 *    - interval [50ms]: wait time between empty process attempts
 *    - store: use if sending in a constructed seed storage engine
 *    - redis: alternative to `store`. options to send to seed-redis
 *
 * @param {Object} options
 */

function Queue (options) {
  options = options || {};
  this.interval = options.interval || 50;
  this._store = options.store || new RedisStore(options.redis || {});
  this._tasks = new Seed.Hash(null, { findRoot: '_attributes' });
  this._processor = new Processor({
    store: this._store
  });
}

/*!
 * Inherits from Drip
 */

util.inherits(Queue, Drip);

/**
 * # use (fn)
 *
 * Experimental interface for plugins
 */

Queue.prototype.use = function (fn) {
  this._stack.push(fn(this));
};

/**
 * # define (name)
 *
 * Creates a new task definition for this queue.
 *
 * @param {String} name
 * @returns {Task} for further configuration
 */

Queue.prototype.define = function (name) {
  var task = new Task;
  task.set({ 'name': name });
  this._tasks.set(name, task);
  return task;
};

/**
 * # create (task, data)
 *
 * Queue up a job for a given task. Use the given data.
 *
 * @param {String} task
 * @param {Object} data to pass to runner
 * @returns {Job} for further configuration, event binding
 */

Queue.prototype.create = function (task, data) {
  var attrs = {
      task: task
    , data: data
    , status: 'queued'
  };

  var job = new Job(attrs, { store: this._store });
  job.save();
  return job;
};

/**
 * # process (tags)
 *
 * Start a process loop for a given Array of tags.
 *
 * @param {Array} tags in order of priority
 */

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

/**
 * # processTag (tag, next)
 *
 * Finds all task names for a given tag and pass off to
 * Task locator.
 *
 * @param {String} tag name
 * @param {Function} next callback
 * @api private
 */

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

/**
 * # processTask (task, next)
 *
 * Refresh the processor and load all tasks that need
 * processing for a given Task. Pass off job for executing
 *
 * @param {String} task identifier
 * @param {Function} next callback
 * @api private
 */

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

