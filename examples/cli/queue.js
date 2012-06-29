var kinetik = require('../..')
  , queue = kinetik();

var action = function (job, next) {
  setTimeout(next, 20);
}

queue
  .define('messaging.one')
  .desc('This is the first task')
  .tag('messaging')
  .action(action);

queue
  .define('messaging.two')
  .desc('This is another messaging task')
  .tag('messaging')
  .action(action);

queue
  .define('urgent.one')
  .desc('this is an urgent task')
  .tag('urgent')
  .action(action);

queue
  .define('urgent.two')
  .desc('this is another urgent task')
  .tag('urgent')
  .action(action);

queue
  .define('urgent.three')
  .desc('this is another last urgent')
  .tag('urgent')
  .action(action);

[ 'messaging.one', 'messaging.two', 'urgent.one'
, 'urgent.two', 'urgent.three' ].forEach(function (task) {
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
