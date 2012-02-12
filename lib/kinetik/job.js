var Seed = require('seed')
  , debug = require('debug')('job');

module.exports = Seed.Model.extend('job', {

  process: function (task, cb) {
    var action = task.get('action')
      , job = { data: this.get('data') }
    debug('process %s', this.get('task'));
    action(jab, function (err) {
      var status = (err) ? 'failed' : 'completed';
      job.set({ 'status': status });
      job.save(cb);
    });
  }

});
