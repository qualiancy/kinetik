var kinetik = require('../..')
  , queue = kinetik.createQueue();

queue
  .define('notify')
  .tag('urgent')
  .action(function (job, done) {
    setTimeout(function () {
      console.log('notify async');
      done();
    }, 100);
  });

queue
  .define('email')
  .tag('normal')
  .action(function (job, done) {
    var address = job.data.email;
    console.log('email job to ' + address);
    done();
  });

queue.on('iterate', function (tag) {
  console.log('checking tag %s', tag);
});

queue.on('flush', function (tags) {
  console.log('tags empty: %s', tags.join(', '));
});

queue.use(kinetik.environment([ 'normal', 'urgent' ]));
