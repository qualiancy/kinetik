/*!
 * kinetik - job model
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , debug = require('debug')('kinetik:job');

/*!
 * Model dependancies
 */

var JobSchema = require('./job.schema');

/*!
 * Extend Seed.Model
 */

module.exports = Seed.Model.extend('job', {

    schema: JobSchema

    /*!
     * # process (task, callback)
     *
     * Process a given job using the incoming passed
     * Task. Mark as succeeded or failed.
     *
     * @param {Seed.Model} task
     * @param {Function} callback upon completion
     * @api private
     */

  , process: function (task, cb) {
      var self = this
        , action = task.get('action')
        , job = {
              id: this.id
            , data: this.get('data')
          };

      debug('processing %s', this.get('task'));
      this.set('status', 'processing');
      this.save(function (err) {
        if (err) return cb(err);
        action(job, function next (fail) {
          if (fail) {
            var message = (fail.message && 'string' === typeof fail.message)
              ? fail.message
              : (('string' === typeof fail)
                ? fail
                : 'undefined error');

            self.set('status', 'failed');
            self.set('error', message);
          } else {
            self.set('status', 'completed');
          }

          debug('job %s finished with status: %s'
            , self.get('task')
            , self.get('status')
          );

          self.save(function (err) {
            if (fail) task.emit('error', fail, self);
            else task.emit('completed', self);
            if (err) return cb(err);
            cb(null);
          });
        });
      });
    }

    /**
     * # cancel (task, callback)
     *
     * Cancel the job and emit `cancel` event.
     *
     * @param {Seed.Model} task
     * @param {Function} callback upon completion
     * @api private
     */

  , cancel: function (task, cb) {
      var self = this;
      this.set('status', 'cancelled');
      if (test) task.emit('cancelled', this);
      this.save(cb);
    }
});
