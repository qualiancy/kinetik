/*!
 * Kinetik - cli task listings
 * Copyright (c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Help descriptor
 */

program
  .command('tasks')
  .desc('get a list of all of tasks for this queue')
  .option('-t, --tags', 'filter by tag. comma delimitted list')
  .action(getTasks);

/**
 * ## getTasks (args)
 *
 * Get a list of all tasks and display to the user.
 *
 * @param {Object} electron parsed process.argv
 */

function getTasks (args) {
  var queue = program._queue
    , tags = queue.tags
    , filter = args.param('t', 'tags');

  function log (s) {
    s = s || '';
    console.log('  ' + s);
  }

  program.header();
  log();
  log('TASKS'.magenta);
  log();

  if (filter) {
    filter = filter.toString().split(',');
    tags = tags.filter(function (t) {
      return (~filter.indexOf(t))
        ? true
        : false;
    });
  }

  var found = false;
  tags.forEach(function (tag) {
    var tasks = queue.tasks.filter(function (t) {
      return t.get('tag') === tag;
    });

    if (tasks.length) {
      found = true;
      log(tag.blue);
      tasks.each(function (task) {
        var desc = task.get('description')
          ? ' - ' + task.get('description')
          : '';
        log('  ' + task.get('name') + desc.gray);
      });
      log();
    }
  });

  if (!found) {
  }
  program.footerOk();
}
