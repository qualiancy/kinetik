/*!
 * kinetik - task model
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed');

/*!
   * Kinetik dependancies
 */

var _ = require('../util');

/**
 * ## Task API
 *
 * When using the `define` method from your Queue, you will
 * be returned a new instance of a `Task`. In Kinetik, the purpose
 * of a task is to define how to process a given job.
 *
 *     var task = queue.define('email.welcome')
 *       .tag('messaging')
 *       .action(function (job, done) {
 *         var locals = { name: job.data.name };
 *         render('./emails/welcome.jade', locals, function (err, html) {
 *           if (err) return done(err);
 *           asyncMailer(email, html, function (err, transId) {
 *             if (err) return done(err);
 *             job.log('Email sent', { receipt: transId });
 *             done();
 *           });
 *         });
 *       });
 *
 * ##### Necessities
 *
 * Each task is created with a unique `name` that will be referenced
 * when you create jobs. This is completely arbitrary, but avoid using
 * `:` as a namespace delimeter, as Kinetik uses that internally.
 *
 * The `tag` is used to group the jobs for the queue processor. These
 * are arbitrary keywords and can be as simple as priorities, such as
 * `normal` and `important` OR task groupings such as `messaging` and
 * `db aggregation`.
 *
 * The `action` is the function that is to be executed to process the job.
 * Actions are asyncronous by nature and are provide a number of helper
 * methods from Kinetik (more later).

 * ##### Events
 *
 * A task is also an event-emitter which will emit the following events
 * for each job that is processed through a task.
 *
 * * `complete` - (job) - when a job has completed
 * * `fail` - (err, job) - when a job has failed errored
 * * `timeout` - (job) - when a job has timed out
 * * `log` - (job, line) - when a job has logged a line of data
 * * `progress` - (job, current, total) - when the progress helper is emitted
 *
 * In all of the events, the `job` parameter provided is a job
 * model that can be updated and saved to your data store. This
 * allows you the flexibility to:
 *
 * * Provide your own re-queue methodology.
 * * Delete jobs that have been completed.
 *
 * You should, however, avoid updating the log model during a `log` or
 * `progress` event as the action is still being processed. The status
 * events occur after the results of the job have been committed to the
 * database.
 *
 * @header Task API
 */

module.exports = Seed.Model.extend('task', {


  /*!
   * ## initialize ()
   *
   * Initializes the task with the default options.
   * Called automatically on task construction.
   *
   * @api private
   */

    initialize: function () {
      this.set('tag', 'default');
    }

    /**
     * ### .tag (tag)
     *
     * Tag a task as belonging to a given tag. All tasks
     * require a tag to be found by the queue processor, but
     * tasks will use `default` until this is defined.
     *
     *     task.tag('urguent')
     *
     * @param {String} tag
     * @returns `this` for chaining
     * @name tag
     * @api public
     */

  , tag: function (tag) {
      this.set('tag', tag);
      return this;
    }

    /**
     * ### .desc (description)
     *
     * Provide a short description about the task being
     * defined. This can be used by middleware.
     *
     * @param {String} description
     * @returns `this` task for chaining
     * @name desc
     * @api public
     */

  , desc: function (desc) {
      this.set('description', desc);
      return this;
    }

    /**
     * ### .timeout (duration)
     *
     * Provides a timeout duration for the action. If this
     * time length has been reached an action will be marked
     * as `timeout`. If no timeout value is defined, an action
     * can run indefinately. Even though the `action` function
     * is still running in limbo, Kinetik will have moved on
     * and any attempts to change the status of the job or
     * emit log and progress will be ignored.
     *
     *     task.timeout(10000); // 10 seconds
     *     task.timeout('1m'); // 1 minute
     *
     * @param {Number|String} duration
     * @returns `this` task for chaining
     * @name timeout
     * @api public
     */

  , timeout: function (n) {
      var time = _.ms(n);
      this.set('timeout', time);
      return this;
    }

    /**
     * ### .action (fn)
     *
     * Provides an action for a given task. When executed,
     * the action will receive two arguments:
     *
     * * `job` - _{Object}_ - encapsulats everything about a job
     * * `done` - _{Function}_ - indicates when the action has completed
     *
     * In the `job` object, the following properties are available.
     *
     * * `id` - _{Number|String}_ - the id of the job according to your database
     * * `data` - _{Object}_ - data attributes passed on job creation
     * * `progress` - _{Function}_ - indicate the progress of actions
     * with multiple steps.
     * * `log` - _{Function}_ - method used to log a line item to the
     * database for that job.
     *
     * ##### Indicating Progress
     *
     * You can use the `progress` method to indicate the current position
     * if the task has multiple steps. This is not saved to the database, but
     * instead emitted as the `progress` event on onto the task.
     *
     *     // current, total
     *     job.progress(10, 100);
     *
     * ##### Logging
     *
     * Each task can have log items associated with them. Kinetik creates
     * a few of these on creation, completion, failure, and timeout. You
     * also have the ability to create these. Each one is timestamped and
     * can include a message and options JSON data to accompany the log item.
     *
     *     // message, data
     *     job.log('Email send complete.', { receipt: transactionId });
     *
     * During a job run these are emitted immediately as the `log` event
     * to the task. They are also stored in memory and pushed the the
     * database as a batch at the completion of action.
     *
     * ##### Indicating Completion
     *
     * If you want to mark the job as `errored` as opposed to
     * `completed`, you can send a parameter to the done function.
     *
     *     done('This job completed with an error.');
     *     done(new Error('This job completed with an error.');
     *
     * If a string is provided it will be logged as the error message;
     * if an object (such as a constructed javascript  `Error`) is sent,
     * kinetik will attempt to read the the object's `message` property as
     * the failure reason, and also the error `code` property if there is
     * one.
     *
     * @param {Function} action function
     * @returns `this` task for chaining
     * @name action
     * @api public
     */

  , action: function (fn) {
      this.set('action', fn);
      return this;
    }

});
