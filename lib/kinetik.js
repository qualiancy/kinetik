
var fs = require('fs')
  , path = require('path');

var Queue = require('./kinetik/queue');

var exports = module.exports = createQueue;

exports.version = '0.0.11';
exports.createQueue = createQueue;

function createQueue (options) {
  var queue = new Queue(options);
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

