/*!
 * kinetik - queue
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , RedisStore = require('seed-redis')
  , debug = require('debug')('kinetik:queue')
  , util = require('util')
  , _ = require('./util');

/*!
 * Local module dependancies
 */

var Task = require('./seed/task.model')
  , Job = require('./seed/job.model')
  , Processor = require('./seed/processor.graph');

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
  Seed.EventEmitter.call(this);
  options = options || {};
  this.interval = options.interval || _.ms('10s');
  this.wait = 0;
  this._store = options.store || new RedisStore(options.redis || {});
  this._tasks = new Seed.Hash(null, { findRoot: '_attributes' });
  this._processor = new Processor({
    store: this._store
  });
}

/*!
 * Inherits from Drip
 */

util.inherits(Queue, Seed.EventEmitter);

/**
 * # tags __getter__
 *
 * Get a list of all of the tags for tasks
 * attached to the current queue instance.
 *
 * @api public
 */

Object.defineProperty(Queue.prototype, 'tags',
  { get: function () {
      var tags = [];
      this._tasks.each(function (task) {
        var tag = task.get('tag');
        if (tag && !~tags.indexOf(tag))
          tags.push(tag);
      });
      return tags;
    }
});

/**
 * # use (fn)
 *
 * Experimental interface for plugins
 *
 * @param {Function} middleware loader
 * @returns {this} for chaining
 */

Queue.prototype.use = function (fn) {
  if ('function' === typeof fn.handle) {
    fn.handle(this);
  } else {
    fn(this);
  }

  return this;
};

/**
 * # configure ([env], fn)
 *
 * Run certain functions only if NODE_ENV process
 * environment variable matches defined `env`.
 *
 * @param {String} environment to check (optional)
 * @param {Function} function execute if match
 * @api public
 */

Queue.prototype.configure = function (env, fn) {
  var node_env = process.env.NODE_ENV || 'development';
  if ('function' === typeof env) return env();
  if (node_env == env) return fn();
  return false;
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
  task.set('name', name);
  this._tasks.set(name, task);
  debug('new task defined: %s', name);
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

Queue.prototype.create = function (task, data, delay) {
  if (delay) delay = _.ms(delay);
  var self = this
    , attrs = {
          task: task
        , data: data || {}
        , created: new Date().getTime()
        , status: (delay)  ? 'delayed' : 'queued'
      };

  if (attrs.status == 'delayed')
    attrs.delay = attrs.created + delay;

  var job = new Job(attrs, { store: this._store });

  this.wait++;
  job.save(function (err) {
    if (err) self.emit('error', err);
    --self.wait || self.emit('drain');
  });

  return job;
};

/**
 * # process (tags)
 *
 * Start a process loop for a given Array of tags.
 *
 * @param {Array} tags in order of priority
 */

Queue.prototype.process = function (tags, int) {
  var self = this
    , interval = int ? _.ms(int) : this.interval;

  function next () {
    self.emit('flush', tags);
    setTimeout(function () {
      self.process(tags, interval);
    }, interval || self.interval);
  }

  function iterate (i) {
    var tag = tags[i];
    if (!tag) return next();
    self.emit('iterate', tag);
    self.processTag(tag, function (filled) {
      if (!filled) return iterate(++i);
      self.process(tags, interval);
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
    , tasks = this._tasks.find({ 'tag': tag });

  function iterate (i) {
    var task = tasks.at(i);
    if (!task) return next(null);
    self.processTask(task, function (job) {
      if (!job) return iterate(++i);
      debug('found job %s', job.get('task'))
      job.process(task, function (err) {
        if (err) self.emit('error', err);
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
 * @param {Model Instance} task
 * @param {Function} next callback
 * @api private
 */

Queue.prototype.processTask = function (task, next) {
  var self = this
    , query = {
          $or: [
            { 'status': 'queued'
            , 'task': task.get('name') }
          , { 'status': 'delayed'
            , 'task': task.get('name')
            , 'delay': { $lt: new Date().getTime() } }
         ]
      };

  this._processor.flush();
  this._processor.fetch('job', query, function (err) {
    var jobs = self._processor.filter('job');
    if (jobs.length == 0) return next(null);
    next(jobs.at(0));
  });
};

/**
 * # cancel (job, callback)
 *
 * Cancel a specific job. Accepts either job
 * instance of Seed.Model or id of job.
 *
 * @param {Seed.Model|ID} job instance or id
 * @param {Function} callback upon compltion
 * @api public
 */

Queue.prototype.cancel = function (job, cb) {
  var self = this;
  if (!job instanceof Seed.Model)
    job = new Job({ _id: job }, { store: this._store });

  job.fetch(function (err) {
    if (err) {
      self.emit('error', err);
      return cb.call(self, err);
    }

    // see if task is available
    var task = self._tasks.get(job.get('task'));
    job.cancel(task, function (err) {
      if (err) {
        self.emit('error', err);
        return cb.call(self, err);
      }
      cb.call(self, null);
    });
  });
};

/**
 * # fetch (query, callback)
 *
 * Allows for direct access to Seed Graph of of jobs for
 * data manipulation. Useful if you want to retrieve jobs
 * that were previously scheduled or included. Also, used
 * internally for various tasks, such as cleaning or stats.
 *
 * The returned `jobs` parameter in the callback is a Seed.Hash
 * instance. Here is a sample map/reduce pattern that will get
 * the count of queued jobs by task.
 *
 *     queue.fetch({ status: 'complete' }, function (err, jobs) {
 *       var results = jobs.mapReduce(
 *           function mapFn (key, value, emit) {
 *             var task = value.get('task');
 *             emit(task, 1);
 *           }
 *         , function reduceFn (key, value) {
 *             return value.length;
 *           }
 *       );
 *
 *       results.each(function (value, key, index) {
 *         console.log('The task %s has [%d] queued jobs.', key, value);
 *       });
 *     });
 *
 * @param {Object} query
 * @param {Function} callback will return params err||null, graph.
 * @api public
 */

Queue.prototype.fetch = function (query, cb) {
  var self = this
    , processor = new Processor({ store: this._store });
  cb = cb || function () {};
  processor.fetch('job', query, function (err) {
    if (err) return cb.call(self, err);
    var jobs = processor.filter('job');
    cb.call(self, null, jobs);
  });
};

/**
 * # clean (tags, callback)
 *
 * Remove all complete tasks for given (optional)
 * tags. Will call callback upon completion. If no
 * tags are specified, all tags will be cleaned.
 *
 * @param {Array} tags (optional)
 * @param {Function} callback
 * @api public
 */

Queue.prototype.clean = function (tags, cb) {
  var self = this
    , query = { status: 'completed' };

  if ('function' == typeof tags) {
    cb = tags;
    tags = null;
  }

  if (tags) {
    var tasks = [];
    tags.forEach(function (tag) {
      var list = self._tasks.find({ tag: tag });
      list.each(function (item) {
        tasks.push(item.get('name'));
      });
    });
    query.task = { $in: tasks };
  }

  this.fetch(query, function (err, jobs) {
    if (err) return cb(err);
    var len = jobs.length;
    if (len === 0) return cb(null);
    function next () { --len || cb(null); }
    jobs.each(function (job) {
      job.destroy(next);
    });
  });
};
