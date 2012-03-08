/*!
 * Kinetik - environment middleware
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var debug = require('debug')('kinetik:environment');

/*!
 * Primary export
 */

module.exports = function (tags) {
  if (process.env && process.env.QUEUE)
    tags = process.env.QUEUE.split(',');

  return function (queue) {
    if (!tags) return;
    debug('kinetik environment middleware loaded for tags: %s', tags.join(', '));
    queue.process(tags);
  }
}
