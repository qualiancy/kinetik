/*!
 * kinetik - processor graph
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed');

/*!
 * Local module dependancies
 */

var Job = require('./job.model');

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

    initialize: function () {
      if (!this.store)
        throw new Error('Kinetik requires a `store`.');

      this.define(Job);
    }

});
