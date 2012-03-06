var kinetik = require('../..')
  , queue = kinetik.createQueue();

queue.on('drain', function () {
  process.exit();
});

queue.create('notify');

queue.create('email', {
    email: 'jake@alogicalparadox.com'
  , subject: 'Hello Universe'
});

