/*!
 * Kinetik - cli middleware
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

module.exports = function () {
  var program = require('./cli')
    , path = require('path');

  return function (queue) {
    var name = path.basename(process.argv[1]);
    program.opts.base = 'node ' + name;
    program._queue = queue;
    process.nextTick(function () {
      program
        .cwd(process.cwd())
        .parse(process.argv);
    });
  }
}
