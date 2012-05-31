/*!
 * Kinetik - CLI
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var kinetik = require('../../kinetik')
  , electron = require('electron');

/*!
 * Create an electron based cli
 */

program = electron('kinetik')
  .name('Kinetik')
  .version(kinetik.version);

/*!
 * Load all the CLI submodules
 */

require('./tasks');
require('./jobs');

/*!
 * main export
 */

module.exports = program;
