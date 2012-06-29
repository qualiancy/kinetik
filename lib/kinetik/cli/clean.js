/*!
 * Kinetik - cli flush jobs
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

program
  .command('clean')
  .description('clean jobs of given status and/or tags from the db')
  .option('-t, --tags', 'flush by tag. comma delimited list')
  .option('-s, --status', 'flush by status. comma delmited list')
  .action(flushJobs);

/**
 * ## flush Jobs
 *
 * Flush jobs by status and/or tag
 *
 * @param {Object} electron parsed process.argv
 */

function flushJobs (args) {
  var queue = program._queue;

  function log (s) {
    s = s || '';
    console.log('  ' + s);
  }

  program.header();
  log();
  log('FLUSH'.magenta);

  var tagFilter = args.param('t', 'tags')
      ? args.param('t', 'tags').split(',')
      : null
    , statusFilter = args.param('s', 'status')
      ? args.param('s', 'status').split(',')
      : [ 'completed' ];

  log();
  var opts = {};

  if (tagFilter) {
    opts.tags = tagFilter;
    log('Tags: '.blue + tagFilter.join(', ').gray);
  }

  opts.status = statusFilter;
  log('Status: '.blue + statusFilter.join(', ').gray);

  log();
  log('Starting...'.green);
  queue.clean(opts, function (err) {
    if (err) {
      log('Error: '.red + err.message);
      log();
      program.footerNotOk();
    } else {
      log('Done.'.cyan);
      log();
      program.footerOk();
    }
  });
}
