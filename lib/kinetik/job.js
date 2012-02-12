var Seed = require('seed')
  , debug = require('debug')('job');

module.exports = Seed.Model.extend('job', {

  process: function (task, cb) {
    var action = task.get('action')
      , job = { data: this.get('data') }
    debug('process %s', this.get('task'));
    action(job, cb || function () {});
  }

});
