/*!
 * kinetik - processor graph
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , RedisStore = require('seed-redis').Store

/*!
 * Local module dependancies
 */

var Job = require('./job');

/*!
 * Extend Seed.Graph
 */

module.exports = Seed.Graph.extend({

    /**
     * # initialize (options)
     *
     * Called upon construction. Associates the store
     * and defines models.
     *
     * @param {Object} options
     */

    initialize: function (options) {
      options = options || {};
      if (!options.store) throw new Error('Store required');
      this.store = options.store;
      this.define(Job);
    }

});
