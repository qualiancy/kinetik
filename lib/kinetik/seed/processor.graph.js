/*!
 * kinetik - processor graph
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , debug = require('debug')('kinetik:processor')

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
      if (!this.store) throw new Error('Kinetik requires a `store`.');
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
        , param = {
              id: job.id
            , data: job.get('data')
          };

      debug('processing %s', job.get('task'));
      job.set('status', 'processing');
      job.save(function (err) {
        if (err) return cb(err);
        action(param, function next (fail) {
          if (fail) {
            var message = (fail.message && 'string' === typeof fail.message)
              ? fail.message
              : (('string' === typeof fail)
                ? fail
                : 'undefined error');

            job.set('status', 'failed');
            job.set('error', message);
          } else {
            job.set('status', 'completed');
          }

          debug('job %s finished with status: %s'
            , job.get('task')
            , job.get('status')
          );

          job.save(function (err) {
            if (fail) task.emit('error', fail, job);
            else task.emit('completed', job);
            if (err) return cb(err);
            cb(null);
          });
        });
      });
    }
});
