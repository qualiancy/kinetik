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
  .desc('https://github.com/qualiancy/kinetik')
  .version(kinetik.version);

/*!
 * Kinetik cli log header
 */

program.header = function () {
  program.colorize();
  console.log('');
  console.log('  Welcome to ' + 'Kinetik'.gray);
  console.log('  It worked if it ends with ' + 'Kinetik'.gray + ' ok'.green);
};

/*!
 * Kinetik cli log footer ok
 */

program.footerOk = function () {
  program.colorize();
  console.log('  ' + 'Kinetik '.gray + 'ok'.green);
  console.log('');
  process.exit();
};

/*!
 * Kinetik cli log footer not ok
 */

program.footerNotOk = function () {
  program.colorize();
  console.log('  ' + 'Kinetik '.gray + 'not ok'.red);
  console.log('');
  process.exit(1);
};

/*!
 * Load all the CLI submodules
 */

require('./tasks');
require('./jobs');

/*!
 * main export
 */

module.exports = program;
