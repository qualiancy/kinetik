var Seed = require('seed')
  , RedisStore = require('seed-redis').Store

var Job = require('./job');

module.exports = Seed.Graph.extend({

    initialize: function (options) {
      options = options || {};
      this.store = options.store || new RedisStore();
      this.define(Job);
    }

});
