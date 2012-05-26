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

/*!
 * Extend Seed.Model
 */

module.exports = Seed.Model.extend('task', {

    /**
     * # tag(string)
     *
     * Tag a task as belonging to a given tag.
     *
     * @param {String} tag
     * @returns this for chaining
     * @api public
     */

    tag: function (tag) {
      this.set('tag', tag);
      return this;
    }

    /**
     * # action(function)
     *
     * Provide an action for a given task.
     *
     * @param {Function} action function
     * @returns this for chaining
     * @api public
     */

  , action: function (fn) {
      this.set('action', fn);
      return this;
    }

    /**
     * # .timeout(time)
     *
     * Provide a timeout duration.
     *
     * @param {Function} duration
     * @returns this for chaining
     * @api public
     */

  , timeout: function (n) {
      var time = _.ms(n);
      this.set('timeout', time);
      return this;
    }
});
