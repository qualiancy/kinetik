/*!
 * Kinetik - cli job listings
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

program
  .command('jobs')
  .description('get a list of all of the jobs in this queue')
  .option('-t, --tags', 'filter by tag. comma delimited list')
  .option('-a, --tasks', 'filter by task. comma delimeted list')
  .option('-s, --status', 'filter by status')
  .action(getJobs);

/**
 * ## getJobs
 *
 * Get a list of all jobs running by status
 * and display to the user.
 *
 * @param {Object} electron parsed process.arg
 */

function getJobs (args) {
  var queue = program._queue
    , series = require('seed').async.forEachSeries
    , tags = queue.tags;

  function log (s) {
    s = s || '';
    console.log('  ' + s);
  }

  program.header();
  log();
  log('JOBS'.magenta);

  var tagFilter = args.param('t', 'tags')
    , taskFilter = args.param('a','tasks')
    , statusFilter = args.param('s', 'status');

  if (tagFilter) {
    tagFilter = tagFilter.toString().split(',');
    tags = tags.filter(function (t) {
      return (~tagFilter.indexOf(t))
    });
  }

  var found = false;
  series(tags, function (tag, next) {
    if (taskFilter) taskFilter = taskFilter.toString().split(',');
    var tasks = queue._tasks.filter(function (t) {
      if (taskFilter) {
        return ~taskFilter.indexOf(t.get('name'))
          && t.get('tag') === tag;
      } else {
        return t.get('tag') === tag;
      }
    });

    if (tasks.length) {
      found = true;
      log();
      log(tag.blue);
      series(tasks.toArray(), function (_task, done) {
        var task = _task.value;
        var query = { task: task.get('name') };
        if (statusFilter) query.status = statusFilter.toString();
        queue.fetch(query, function (err, jobs) {
          var statuses = jobs.mapReduce(
              function mapFn (key, value, emit) {
                emit(value.get('status'), 1);
              }
            , function reduceFn (key, value) {
                return value.length;
              }
          );

          if (statuses.length) {
            log('  ' + task.get('name'));
            statuses.each(function (value, key) {
              log('    ' + value.toString().cyan + ' ' + key.gray);
            });
          }
          done();
        });
      }, next);
    } else {
      next();
    }
  }, function done () {
    log();
    program.footerOk();
  });
}
