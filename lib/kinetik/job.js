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
 * Extend Seed.Model
 */

module.exports = Seed.Model.extend('job', {

    /**
     * # process (task, callback)
     *
     * Process a given job using the incoming passed
     * Task. Mark as succeeded or failed.
     *
     * @param {Seed.Model} task
     * @param {Function} callback upon completion
     * @api private
     */

    process: function (task, cb) {
      var self = this
        , action = task.get('action')
        , job = { data: this.get('data') }
      debug('processing %s', this.get('task'));
      action(job, function (err) {
        if (err) {
          if (err.message) self.set('error', err.message);
          self.set('status', 'failed');
          task.emit('error', self, err);
        } else {
          self.set('status', 'completed');
          task.emit('completed', self);
        }
        debug('job %s finished with status: %s'
          , self.get('task')
          , self.get('status')
        );
        self.save(cb);
      });
    }

});
