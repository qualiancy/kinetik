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

module.exports = Seed.Graph.extend({

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
      this.tasks = opts.tasks;
      this.queue = opts.queue;
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
          job.process(task, function (err) {
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
});
