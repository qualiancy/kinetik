# Kinetik

> A tag-based job queue backed by [Seed](http://github.com/qualiancy/seed).

Kinetik jobs are placed in a background queue and categoried by tag. Workers can then be spawned to focus
on a given set of tags. 

### What is Seed?

[Seed](http://github.com/qualiancy/seed), which stands for _storage-agnostic, event emitting datasets_, 
is a library of components that provide a common API for working with data, no matter the source. 

By using Seed, a Kinetik queue can be stored using any of Seed's storage adapters, including
[Redis](https://github.com/qualiancy/seed-redis) or [MongoDB](https://github.com/qualiancy/seed-mongodb).

[Visit the Seed project page](http://github.com/qualiancy/seed) to learn more, and see alternative storage solutions.

## Installation

Kinetik is available on NPM.

      $ npm install kinetik

## Basic Usage

#### Choose Your Storage

The first step to using Kinetik is creating a new Queue using one of Seed's storage engines.

```js
var kinetik = require('kinetik')
  , RedisStore = require('seed-redis').Store;

// we are using a redis with a default config
var queue = kinetik.createQueue({
  store: new RedisStore()
});
```

You can use any of Seed's available storage adapters. See that adapater's documentation for relevant configurations.

#### Defining Jobs

Next, you will need to define a job.

```js
queue
  .define('send email')
  .tag('notifications')
  .action(function (job, done) {
    var email = job.data.email
      , subject = job.data.subject;
    myAsyncMailer(email, subject, function (err) {
      if (err) return done(err);
      done();
    });
  });

// tell our queue to process all incoming `notifications`.
queue.process([ 'notifications' ]);
```

*Notes*

* The `tag` "notifications" allows us to group common types of jobs together for completion by a single worker process.
* The `job` parameter for the action will be comprised of all relevant data needed to complete the task.
* The `done` parameter for the action accepts an error object as parameter. If sent, will flag job as `failed`, otherwise will flag as `complete`.

#### Adding Jobs

Next, you will need to create jobs...

```js
queue.create('send email', {
    email: 'ford@hitchhikersguide.com'
  , subject: 'Hello Universe'
});
```
Since our queue is processing `notifications`, this will job will be processed on the iteration through the `notifications` tag.

## Advanced Usage

Coming soon as the API progresses.

## Contributing

Interested in contributing? Fork to get started. Contact [@logicalparadox](http://github.com/logicalparadox) 
if you are interested in being regular contributor.

##### Contibutors 

* Jake Luer ([Github: @logicalparadox](http://github.com/logicalparadox)) ([Twitter: @jakeluer](http://twitter.com/jakeluer)) ([Website](http://alogicalparadox.com))

## License

    (The MIT License)

    Copyright (c) 2011-2012 Jake Luer <jake@alogicalparadox.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
