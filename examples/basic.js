var kinetik = require('..');

queue = kinetik.createQueue();

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
    console.log('email job');
    done();
  });

function notify() {
  queue.create('notify');
}

function sendEmail () {
  queue.create('email', {
      address: 'jake@alogicalparadox.com'
    , subject: 'Hello Universe'
  });
}

setInterval(notify, 3000);
setInterval(sendEmail, 1000);

var tags;
if (process.env.QUEUE) tags = process.env.QUEUE.split(',');
else tags = [ 'urgent', 'normal' ];

queue.process(tags);
