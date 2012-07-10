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

var Job = require('./job.model')
  , Log = require('./log.model');

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
      this.define(Log);
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

      this.flush();
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
        , retry = task.get('retry')
        , maxRetry = task.get('maxRetry')
        , retryDelay = task.get('retryDelay')
        , hasTimedOut = false
        , timeoutHandle = null
        , param = {};

      // set id
      param.id = job.id;

      // dereference the data
      param.data = isType(job.get('data'), 'object')
        ? Seed.utils.deepMerge({}, job.get('data'))
        : null;

      // proxy progress calls to task emitter
      param.progress = function (curr, total) {
        if (hasTimedOut) return;
        debug('task %s at progress %n/%n', curr, total);
        task.emit('progress', job, curr, total);
      };

      // handle log writes
      param.log = function (msg, data) {
        if (hasTimedOut) return;
        var line = self.set('log', { message: msg });
        if (data) line.set('data', data);
        line.set('timestamp', new Date().getTime());
        line.set('job', job);
        debug('task %s log: %s', msg);
        task.emit('log', job, line);
      };

      // automatically log start and finish
      function autoLog () {
        switch (job.get('status')) {
          case 'completed':
            param.log('Job completed successfully');
            break;
          case 'failed':
            param.log('Job has failed: "' + job.get('error.msg') + '"');
            break;
          case 'timeout':
            param.log('Job has timed out after ' + timeout + 'ms');
            break;
          case 'processing':
            param.log('Job has started processing');
            break;
        }
      }

      // handle end of job
      function emitHandler (_fail) {
        switch (job.get('status')) {
          case 'completed':
            task.emit('complete', job);
            self.emit([ 'task', 'complete' ], task, job);
            debug('task %s successful for job %s', task.get('name'), job.id.toString());
            break;
          case 'failed':
            task.emit('fail', _fail, job);
            self.emit([ 'task', 'fail' ], _fail, task, job);
            debug('task %s failed for job %s', task.get('name'), job.id.toString());
            break;
          case 'timeout':
            task.emit('timeout', job);
            self.emit([ 'task', 'timeout' ], task, job);
            debug('task %s timed out for job %s', task.get('name'), job.id.toString());
            break;
        }
      }

      // save handler on complete or timeout
      function handleSave (_fail) {
        self.push(function (err) {
          emitHandler(_fail);
          if (err) return cb(err);
          cb(null);
        });
      }

      // function to pass as next to task action
      function handleNext (_fail) {
        clearTimeout(timeoutHandle);
        if (hasTimedOut) return;
        if (_fail) {
          var fail = parseFail(_fail)
            , tryCount = job.get('retry');
          if (retry && (!maxRetry || tryCount =< maxRetry)) {
            job.set('status', 'delayed');
            job.set('retry', tryCount + 1);
            job.set('delay', new Date().getTime() + retryDelay);
          } else {
            job.set('status', 'failed');
            job.set('error', fail);
          }
        } else {
          job.set('status', 'completed');
        }
        autoLog();
        handleSave(_fail);
      }

      // set status so as not to pick it up again
      job.set('status', 'processing');
      job.save(function (err) {
        if (err) return cb(err);

        // if task has timeout, setup necissaries
        if (timeout && isType(timeout, 'number')) {
          timeoutHandle = setTimeout(function () {
            hasTimedOut = true;
            job.set('status', 'timeout');
            autoLog();
            handleSave(null);
          }, timeout);
        }

        // begin processing
        debug('processing %s', job.get('task'));
        self.emit([ 'task', 'start' ], task, job);
        autoLog();
        action(param, handleNext);
      });
    }

});


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
