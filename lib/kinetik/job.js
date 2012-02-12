/*!
 * kinetik - job model
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , debug = require('debug')('job');

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
      debug('process %s', this.get('task'));
      action(job, function (err) {
        var status = (err) ? 'failed' : 'completed';
        self.set({ 'status': status });
        self.save(cb);
      });
    }

});
