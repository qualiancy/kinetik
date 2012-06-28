/*!
 * kinetik - processor graph
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , debug = require('debug')('kinetik:processor');

/*!
 * isType (type
 *
 * Type checking helper.
 */

function isType () {
  var obj = arguments[0]
    , args = Array.prototype.slice.call(arguments, 1)
    , toString = Object.prototype.toString
    , res = false;

  args.forEach(function (type) {
    var klassStart = type.charAt(0).toUpperCase()
      , klass = klassStart + type.slice(1);
    if ('[object ' + klass + ']' === toString.call(obj)) res = true;
  });

  return res;
}

/*!
 * Local module dependancies
 */

var Job = require('./job.model');

/*!
 * Extend Seed.Graph
 */

module.exports = Seed.Graph.extend('processor', {

    /*!
     * # initialize (options)
     *
     * Called upon construction. Associates the store
     * and defines models.
     *
     * @param {Object} options
     */

    initialize: function (opts) {
      this.store = opts.store;
      this.queue = opts.queue;
      this.tasks = opts.tasks || this.queue._tasks;
      this.define(Job);
    }


    /*!
     * # processTag (tag, next)
     *
     * Finds all task names for a given tag and pass off to
     * Task locator.
     *
     * @param {String} tag name
     * @param {Function} next callback
     * @api private
     */

  , processTag: function (tag, next) {
      var self = this
        , tasks = this.tasks.find({ 'tag': tag });

      function iterate (i) {
        var task = tasks.at(i);
        if (!task) return next(null);
        self.findJobs(task, function (err, job) {
          if (err) self.queue.emit('error');
          if (!job) return iterate(++i);
          debug('found job %s', job.get('task'))
          self.processJob(job, task, function (err) {
            if (err) self.queue.emit('error', err);
            next(true);
          });
        });
      }

      iterate(0);
    }

    /*!
     * # findJobs (task, next)
     *
     * Refresh the processor and load all tasks that need
     * processing for a given Task. Pass off job for executing
     *
     * @param {Model Instance} task
     * @param {Function} next callback
     * @api private
     */

  , findJobs: function (task, next) {
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

      this.fetch('job', query, function (err) {
        if (err) return next(err);
        var jobs = self.filter('job');
        if (jobs.length == 0) return next(null);
        next(null, jobs.at(0));
      });
    }

    /*!
     * # processJob (job, task, cb)
     *
     * Process a given job using the incoming passed
     * Task. Mark as succeeded or failed and emit
     * relevant events to the task and queue.
     *
     * @param {Seed.Model} task
     * @param {Function} callback upon completion
     * @api private
     */

  , processJob: function (job, task, cb) {
      var self = this
        , action = task.get('action')
        , timeout = task.get('timeout')
        , hasTimedOut = false
        , timeoutHandle = null
        , param = {
              id: job.id
            , data: job.get('data')
            , emit: null
            , progress: null
          };

      debug('processing %s', job.get('task'));
      job.set('status', 'processing');
      job.save(function (err) {
        if (err) return cb(err);

        // save handler on complete or timeout
        function handleSave (_fail) {
          job.save(function (err) {
            emitHandler(self, task, job, _fail);
            if (err) return cb(err);
            cb(null);
          });
        }

        // function to pass as next to task action
        function handleNext (_fail) {
          clearTimeout(timeoutHandle);
          if (hasTimedOut) return;
          if (_fail) {
            var fail = parseFail(_fail);
            job.set('status', 'failed');
            job.set('error', fail);
          } else {
            job.set('status', 'completed');
          }
          handleSave(_fail);
        }

        // if task has timeout, setup necissaries
        if (timeout && isType(timeout, 'number')) {
          timeoutHandle = setTimeout(function () {
            hasTimedOut = true;
            job.set('status', 'timeout');
            handleSave(null);
          }, timeout);
        }

        // begin processing
        self.emit([ 'task', 'start' ], task, job);
        action(param, handleNext);
      });
    }

});

function emitHandler (processor, task, job, _fail) {
  switch (job.get('status')) {
    case 'completed':
      task.emit('complete', job);
      processor.emit([ 'task', 'complete' ], task, job);
      debug('task %s successful for job %s', task.get('name'), job.id.toString());
      break;
    case 'failed':
      task.emit('fail', _fail, job);
      processor.emit([ 'task', 'fail' ], _fail, task, job);
      debug('task %s failed for job %s', task.get('name'), job.id.toString());
      break;
    case 'timeout':
      task.emit('timeout', job);
      processor.emit([ 'task', 'timeout' ], task, job);
      debug('task %s timed out for job %s', task.get('name'), job.id.toString());
      break;
  }
}

function parseFail (_fail) {
  var fail = {}
  if (isType(_fail, 'string')) {
    fail.message = _fail;
  } else {
    fail.message = isType(_fail.message, 'string')
      ? _fail.message
      : 'undefined error message';
    fail.code = isType(_fail.code, 'string', 'number')
      ? _fail.code
      : null;
  }
  return fail;
}
