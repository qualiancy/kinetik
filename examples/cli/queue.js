var kinetik = require('..')
  , queue = kinetik();

var action = function (job, next) {
  setTimeout(next, 20);
}

queue
  .define('task:1')
  .desc('This is the first task')
  .tag('messaging')
  .action(action);

queue
  .define('task:message')
  .desc('This is another messaging task')
  .tag('messaging')
  .action(action);

queue
  .define('task:urgent')
  .desc('this is an urgent task')
  .tag('urgent')
  .action(action);

queue
  .define('task:2')
  .desc('this is another urgent task')
  .tag('urgent')
  .action(action);

queue
  .define('task:ping')
  .desc('this is another last urgent')
  .tag('urgent')
  .action(action);

[ 'task:1', 'task:message', 'task:urgent'
, 'task:2', 'task:ping' ].forEach(function (task) {
  var c = Math.floor(Math.random() * 10) || 1;
  for (var i = 0; i < c; i++) {
    queue.create(task, {
      test: true
    });
  }
});

queue.process('urgent');
queue.process('messaging');

// `once` listening and `setTimeout` are only necissary
// for this demo
queue.once('drain', function () {
  setTimeout(function () {
    queue.use(kinetik.cli());
  }, 100);
});
