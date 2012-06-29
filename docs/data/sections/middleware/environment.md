---
  title: Environment
  render-file: false
  weight: 20
---

### Environment

The environment middleware allows you to easily start multiple job processing node processes
based on a set of tags. This allows you to fully utilize the resources of the server or 
servers that Kinetik is running on. Make sure that you are using one of Seed's database
storage engines.

To use the `environment` middleware, start of creating a queue and defining tasks as normal, but
avoid calling `queue.process` directly. Instead, end your program with the following `use`
mechanism:

```js
var kinetik = require('kinetik')
  , RedisStore = require('seed-redis')
  , queue = kinetik(new RedisStore());

// define all your tasks

queue.use(kinetik.environment());
```

This tells the queue to look for the `QUEUE` environment variable and being processing only if 
a list of tags are passed to it. If no `QUEUE` variable is found, the queue will not begin processing.

To start the queue, you then invoke your queue from the command line.

```bash
QUEUE=messaging node queue.js
```

This will start the queue processing the `messaging` tag. You can also spin up multiple processes
including multiple tags.

```bash
QUEUE=messaging node queue.js
QUEUE=db.aggregation,log.rotate node queue.js
```

You now have two node processes working on your queue. 
