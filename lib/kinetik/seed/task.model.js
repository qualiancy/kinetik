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
 * # Defining Tasks
 *
 * When using the `define` method from your Queue, you will
 * be returned a new instance of a `Task`. In Kinetik, the purpose
 * of a task is to define how to process a given job.
 *
 * ### Necessities
 *
 * Each task is created with a unique `name` that will be referenced
 * when you create jobs. In addition, a task should also be given a
 * `tag` and an `action`.
 *
 * The `tag` is used to group the jobs for the queue processor. These
 * are arbitrary keywords and can be as simple as priorities, such as
 * `normal` and `important` OR task groupings such as `messaging` and
 * `dbAggregation`.
 *
 * The `action` is the function that is to be executed to process the job.
 * Actions are asyncronous by nature and provide a number of helper
 * methods (more later).

 * > Advanced Techniques: A `task` is a constructed Seed model that
 * > does not have a store attached to it.
 *
 * ### Events
 *
 * A task is also an event-emitter which will emit the following events
 * for each job that is processed through a task.
 *
 * * `job::start` - (job) - on when a job starts is processing run
 * * `job::complete` - (job) - on when a job has completed
 * * `job::error` - (err, job) - on when a job has errored
 * * `job::timeout` - (job) - on when a job has timed out
 *
 * In all of the events, the `job` parameter provided is a job
 * model that can be updated and saved to your data store. This
 * allows you the flexibility to:
 *
 * * Provide your own re-queue methodology.
 * * Delete jobs that have been completed.
 *
 * ### Defining Tasks
 *
 * Defining a task can be done using chaining.
 *
 *     var task = queue.define('email::welcome')
 *       .tag('messaging')
 *       .on('job::complete', jobCompleteFn)
 *       .action(doSomething);
 *
 * You can use the following API methods to further control yours tasks..
 *
 * @header Defining Tasks
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
     * ## tag (tag)
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
     * ## action (fn)
     *
     * Provides an action for a given task. When executed,
     * the action will receive two parameters:
     *
     * * `job` - **{Object}** - encapsulats everything about a job
     * * `done` - **{Function}** - indicates when the action has completed
     *
     * In the `job` object, the following properties are available.
     *
     * * `id` - **{Number|String}** - the id of the job according to kinetik
     * * `data` - **{Object}** - data attributes passed on job creation
     * * `progress` - **{Function}** - indicate the progress of actions
     * with multiple steps.
     *
     * If you want to mark the job as `errored` as opposed to
     * `completed`, you can send a parameter to the done function.
     *
     *     done('This job completed with an error.');
     *     done(new Error('This job completed with an error.');
     *
     * If a string is provided it will be logged as the error message;
     * if an object (such as an `Error`) is sent, kinetik will
     * attempt to read the the object's `message` property as
     * the failure reason.
     *
     * ### Single-step Actions
     *
     * For example, the following psuedo-code is using an arbitrary
     * database and email delivery service:
     *
     *     task.action(function (job, done) {
     *       db.get(data.id, function (err, doc) {
     *         if (!doc) return done(data.id + ' not found');
     *         if (err) return done(err);
     *         var email = doc.get('email');
     *         email.send(email, 'Hello Universe', function (err) {
     *           if (err) return done(err);
     *           done();
     *         });
     *       });
     *     });
     *
     * ### Multi-step Actions
     *
     * If your action is completed using many steps and you wish to
     * indicate what step you are on, the `job.progress` method
     * can be used to mark the current progress of the action.
     *
     * For example, the following psuedo-code uses an arbitrary
     * database and asyncronous flow control module:
     *
     *     task.action(function (job, done) {
     *       db.get(data.id, function (err, frames) {
     *         if (err) return done(err);
     *         doSeries(frames, function (frame, index, next) {
     *           renderFrame(frame, function (err) {
     *             job.progress(index, frames.length);
     *             next(err);
     *           });
     *         }, done);
     *       });
     *     });
     *
     * @param {Function} action function
     * @returns `this` for chaining
     * @name action
     * @api public
     */

  , action: function (fn) {
      this.set('action', fn);
      return this;
    }

    /**
     * ## .timeout (duration)
     *
     * Provides a timeout duration for the action. If this
     * time length has been reached an action will be marked
     * as `errored` citing that it has timed-out. If no `timeout`
     * is defined, an action can run indefinately.
     *
     *     task.timeout(10000); // 10 seconds
     *     task.timeout('1m'); // 1 minute
     *
     * @param {Number|String} duration
     * @returns this for chaining
     * @name timeout
     * @api public
     */

  , timeout: function (n) {
      var time = _.ms(n);
      this.set('timeout', time);
      return this;
    }
});
