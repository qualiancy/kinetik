/*!
 * kinetik
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var fs = require('fs')
  , path = require('path');

/*!
 * Local module dependancies
 */

var Queue = require('./kinetik/queue');

/*!
 * Primary export
 */

var exports = module.exports = createQueue;

/*!
 * Kinetik version
 */

exports.version = '0.3.1';

/*!
 * Support legacy `createQueue`
 */

exports.createQueue = createQueue;

/*!
 * ### createQueue
 *
 * Create a new kinetik queue with the defined options
 *
 * @param {Object} options
 * @returns {Object} queue
 */

function createQueue (store, opts) {
  var queue = new Queue(store, opts);
  return queue;
};

/*!
 * Middleware placeholder
 */

exports.middleware = {};

/*!
 * Cycle througth middleware folder and provide getters
 * on the exports.middleware and main exports.
 */

fs.readdirSync(__dirname + '/kinetik/middleware').forEach(function (filename) {
  if (!/\.js$/.test(filename)) return;
  var name = path.basename(filename, '.js');

  function load () {
    return require('./kinetik/middleware/' + name);
  }

  Object.defineProperty(exports.middleware, name, { get: load });
  Object.defineProperty(exports, name, { get: load });
});

