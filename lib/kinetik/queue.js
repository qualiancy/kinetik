/*!
 * kinetik - queue
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
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
 * ## Queue API
 *
 * Queue constructor is the main interaction point for the
 * kinetik module. It should be constructed using a Seed
 * storage engines, and any of the below options.
 *
 *     var kinetik = require('kinetik')
 *       , RedisStore = require('seed-redis')
 *       , queue = kinetik(new RedisStore(), { interval: '1m' });
 *
 * ##### Options
 *
 * * `interval` [10s]: wait time after at tag or group of tags has been emptied
 *
 * ##### Events
 *
 * A queue is also an event emitter, which will relay
 * information about task status and the state of the jobs
 * being added to the queue. The following events can be
 * listened for:
 *
 * - `error` - (err) - on any database related errors
 * - `drain` - () - when a stack of jobs have been saved to the db
 * - `empty` - (tags) - after processing a set of tags, prior to
 * pausing for interval duration
 * - `job:define` - (job) - when a job has been created and successfully
 * saved. In this case, job is a constructed Seed model.
 * - `task:define` - (task) - when a task has been defined
 *
 * @header Queue API
 */

function Queue (store, opts) {
  /*!
   * @param {Object} options
   */

  Seed.EventEmitter.call(this);

  // parse args
  if (store && !(store instanceof Seed.Store)) {
    opts = store;
    store = null;
  }

  opts = opts || {};

  // setup store
  if (store && store instanceof Seed.Store) {
    this._store = store;
    debug('using user provided store : %s', store.name);
  } else {
    this._store = new Seed.MemoryStore();
    debug('creating Seed.MemoryStore');
  }

  // defaults
  this._tasks = new Seed.Hash(null, { findRoot: '_attributes' });
  this._opts = {
      wait: 0
    , interval: opts.interval || _.ms('10s')
  };
}

/*!
 * Inherits from Drip
 */

util.inherits(Queue, Seed.EventEmitter);

/**
 * ### .tags
 *
 * A property that can be used to get a list
 * of all of the tags for tasks  attached to the
 * current queue instance. Cannot be set.
 *
 *     console.log(queue.tags); // [ 'messaging' ]
 *
 * @returns {Array}
 * @name tags
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
 * ### .configure ([env,] fn)
 *
 * Run certain function only if NODE_ENV process
 * environment variable matches defined `env`.
 *
 *     queue.configure('development', function () {
 *       queue.use(kinetik.cli());
 *     });
 *
 * @param {String} environment to check (optional)
 * @param {Function} function execute if match
 * @name configure
 * @api public
 */

Queue.prototype.configure = function (env, fn) {
  var node_env = process.env.NODE_ENV || 'development';
  if ('function' === typeof env) return env();
  if (node_env == env) return fn();
  return false;
};

/**
 * ### .use (fn)
 *
 * Load a specific plugin and attach it this queue
 * instance. Argument can either be a function or an
 * object with a method called `handle`. The parameter
 * passed to the function will be the current queue.
 * Useful for code re-use.
 *
 *     queue.use(function (q) {
 *       q.on('error', function (err) {
 *         console.log(err.message);
 *       });
 *     });
 *
 * @param {Function} plugin handle
 * @returns {this} for chaining
 * @name use
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
 * ### .define (name)
 *
 * Creates a new task definition for this queue.
 * See the Task API for how to further configure a
 * task. Do not use the character `:` in your task
 * names as they are reserved for internal event
 * namespacing.
 *
 *     var sendEmail = queue.define('send email');
 *
 * @param {String} name
 * @returns {Task} for further configuration
 * @name define
 */

Queue.prototype.define = function (name) {
  var task = new Task({ name: name });
  this._tasks.set(name, task);
  this.emit([ 'task', 'define' ], task);
  debug('new task defined: %s', name);
  return task;
};

/**
 * ### .create (task, data[, delay])
 *
 * Queue up a job with the given data attributes for
 * a given task. A `delay` can also be provided to prevent
 * a job from being processes until after a given timeframe.
 * Delay can either be in milliseconds, or a string in the
 * appropriate format.
 *
 *     queue.create('send email', {
 *         email: 'ford@hitchhikersguide.com'
 *       , name: 'Ford Prefect'
 *       , subject: 'Welcome to the Guide'
 *     }, '1d');
 *
 * Stringed timestamps can be in any of the following
 * formats: `10ms`, `30s`, `45m`, `2h`, `6d`.
 *
 * The job that is created will be saved asyncronously. If
 * you wish to know when all created jobs in the current
 * scope have been saved, you can listen for the queue
 * `drain` event.
 *
 * @param {String} task
 * @param {Object} data to pass to runner
 * @param {Number|String} delay time specification
 * @returns {Job} for further configuration
 * @name create
 */

Queue.prototype.create = function (task, data, delay) {
  var self = this
    , processor = buildProcessor.call(this)
    , job = processor.set('job', {
          task: task
        , status: 'pre-queue'
      });

  // wait to emit drain event
  this._opts.wait++;

  // apply actual attributes, create log line
  // and push everything to the db
  function commitJob () {
    var attrs = {
        task: task
      , data: data || {}
      , created: new Date().getTime()
      , status: (delay)  ? 'delayed' : 'queued'
    };

    if (attrs.status == 'delayed') {
      attrs.delay = attrs.created + _.ms(delay);
    }

    job.merge(attrs);

    // create log item and associate with job
    var line = processor.set('log', { message: 'Job created' });
    line.set('timestamp', attrs.created);
    line.set('job', job);

    // push the job and log line to the server
    processor.push(function (err) {
      if (err) self.emit('error', err);
      else self.emit([ 'job', 'define' ], job);
      --self._opts.wait || self.emit('drain');
    });
  }

  // save job under prequeue so we have an id defined
  job.save(function (err) {
    if (err) {
      self.emit('error', err);
      --self._opts.wait || self.emit('drain');
    } else {
      commitJob();
    }
  });

  return job;
};

/**
 * ### .process (tags, [interval])
 *
 * Start a process loop for a given set of tags.
 * An interval can also be provided to override the
 * queue interval as the delay between checking for
 * more jobs on the event of all tags being empty.
 *
 *     // use default interval (10s)
 *     queue.process('urgent');
 *
 *     // check every second
 *     queue.process('long', 1000);
 *
 *     // check every 10 minutes
 *     queue.process([ 'messaging', 'dbaggr' ], '10m');
 *
 * For more information on the behavior of
 * `queue.process`, see the Quick Start guide on
 * "Starting the Processor".
 *
 * @param {Array} tags in order of priority
 * @param {String|Number} time to wait between checks
 * @name process
 */

Queue.prototype.process = function (tags, int) {
  var self = this
    , interval = int
      ? _.ms(int)
      : this._opts.interval;

  if (!Array.isArray(tags)) {
    tags = [ tags ];
  }

  function next () {
    self.emit('empty', tags);
    setTimeout(function () {
      self.process(tags, interval);
    }, interval);
  }

  function iterate (i) {
    var tag = tags[i];
    if (!tag) return next();
    self.emit('iterate', tag);
    var processor = buildProcessor.call(self);
    processor.processTag(tag, function (filled) {
      if (!filled) return iterate(++i);
      self.process(tags, interval);
    });
  }

  iterate(0);
};

/**
 * ### .fetch (query, callback)
 *
 * Allows for direct access to Seed Graph of of jobs for
 * data manipulation. Useful if you want to retrieve jobs
 * that were previously scheduled or completed. Also, used
 * internally for various tasks, such as cleaning or stats.
 *
 * No matter which store you are using, the query should
 * be formatted according to Seed's query language, which is
 * a MongoDB compatible, object based query language.
 *
 * The returned `jobs` parameter in the callback is a Seed.Hash
 * instance. Here is a sample map/reduce pattern that will get
 * the count of queued jobs by task:
 *
 *     queue.fetch({ status: 'queued' }, function (err, jobs) {
 *       if (err) throw err;
 *
 *       // aggregate by task name
 *       function map (key, value, emit) {
 *         var task = value.get('task');
 *         emit(task, 1);
 *       }
 *
 *       // reduce by count of emit's per task
 *       function reduce (key, value) {
 *         return value.length;
 *       }
 *
 *       // task welcome email has [42] queued jobs
 *       function display (value, key) {
 *         console.log('task %s has [%d] queued jobs', key, value);
 *       }
 *
 *       // run it
 *       jobs
 *         .mapReduce(map, reduce)
 *         .each(display);
 *     });
 *
 * @param {Object} query
 * @param {Function} callback will return params err||null, graph.
 * @api public
 * @name fetch
 */

Queue.prototype.fetch = function (query, cb) {
  var self = this
    , processor = buildProcessor.call(this);

  cb = cb || function () {};

  processor.fetch('job', query, function (err) {
    if (err) return cb(err);
    var jobs = processor.filter('job');
    cb(null, jobs);
  });
};

/**
 * ### .cancel (job, callback)
 *
 * Cancel a specific job. Accepts either job
 * instance of Seed.Model or id of job. If you
 * cancel jobs using the method on the same constructed
 * queue in which the job's task is defined, a
 * `cancelled` event will be emitted to that task.
 *
 *     var id = job.id;
 *     queue.cancel(job, function (err) {
 *       if (err) throw err;
 *       console.log('job %j has been cancelled', id);
 *     });
 *
 * @param {Job|ObjectId} job instance or id
 * @param {Function} callback upon completion (optional)
 * @api public
 * @name cancel
 */

Queue.prototype.cancel = function (id, cb) {
  var self = this
    , processor = buildProcessor.call(this);

  cb = cb || function () {};

  // helper for any errors
  function handleErr (err) {
    self.emit('error', err);
    cb(err);
  }

  // perform job cancellation and include log item
  function cancelJob (job) {
    job.set('status', 'cancelled');

    // create log item and associate with job
    var line = processor.set('log', { message: 'Job created' });
    line.set('timestamp', new Date().getTime());
    line.set('job', job);

    processor.push(function (err) {
      if (err) return handleErr(err);
      var task = self._tasks.get(job.get('task'));
      if (task) task.emit('cancelled', job);
      cb(null);
    });
  }

  // parse args and load job if needed
  if (id instanceof Job) {
    var job = processor.set(id);
    cancelJob(job);
  } else {
    var job = processor.set('job', id);
    job.fetch(function (err) {
      if (err) return handleErr(err);
      cancelJob(job);
    });
  }
};

/**
 * ### .clean (tags, callback)
 *
 * Remove all complete tasks for given (optional)
 * tags. Will call callback upon completion. If no
 * tags are specified, all tags will be cleaned.
 * Only removes jobs which have a `completed` status;
 * jobs which have timed out or failed will still remain.
 *
 *     queue.clean('messaging', function (err) {
 *       if (err) throw err;
 *       console.log('all completed messaging jobs have been removed');
 *     });
 *
 * @param {String|Array} tags (optional)
 * @param {Function} callback
 * @api public
 * @name clean
 */

Queue.prototype.clean = function (opts, cb) {
  if ('function' == typeof opts) {
    cb = opts;
    opts = {}
  }

  // if no params
  opts = opts || {};
  cb = cb || function () {};

  // set default status
  if (!opts.status) {
    opts.status = 'completed';
  }

  // working with tags
  if (opts.tags && !Array.isArray(opts.tags)) {
    opts.tags = [ opts.tags ];
  }

  var self = this
    , tasks = this._tasks
    , jobQuery = Array.isArray(opts.status)
      ? { status: { $in: opts.status } }
      : { status: opts.status };

  // further limit our query
  if (opts.tags) {
    jobQuery.task = { $in: [] };
    tasks = this._tasks
      .find({ tag: { $in: opts.tags }})
      .each(function (task) {
        jobQuery.task.$in.push(task.get('name'));
      });
  }

  // helper for any errors
  function handleErr (err) {
    self.emit('error', err);
    cb(err);
  }

  // reusable destroy
  function destroy (obj) {
    return function destroyObj (next) {
      obj.destroy(next);
    }
  }

  // queue iterator
  function iterator (fn, next) {
    fn(next);
  }

  // create queue
  var queue = Seed.async.queue(iterator, 10);

  // for each matching job, we need to clean
  // the logs as well
  function cleanLogs (id) {
    var processor = buildProcessor.call(self)
      , logQuery = {};

    logQuery['job.$ref'] = 'job';
    logQuery['job.$id'] = id;

    queue.push(function (next) {
      processor.fetch('log', logQuery, function (err) {
        if (err) return next(err);
        processor.each('log', function (line) {
          queue.push(destroy(line), null, true);
        });
        next();
      });
    });
  }

  // fetch our jobs. queue their removal
  // and their log's removal
  this.fetch(jobQuery, function (err, jobs) {
    if (err) return handleErr(err);
    if (jobs.length === 0) return cb(null);

    jobs.each(function (job) {
      cleanLogs(job.id);
      queue.push(destroy(job));
    });

    queue.onerror = handleErr;
    queue.drain = cb;
    queue.process();
  });
};

function buildProcessor () {
  return new Processor({
      store: this._store
    , tasks: this._tasks
    , queue: this
  });
}
