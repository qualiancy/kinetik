var Seed = require('seed')
  , debug = require('debug')('job');

module.exports = Seed.Model.extend('job', {

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
