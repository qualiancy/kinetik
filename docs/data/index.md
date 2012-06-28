---
  title: Kinetik
---

#### Features

- chainable api
- based on [seed](https://github.com/qualiancy/seed)
- works with numerous data storages
- plugin capable

#### What is Seed?

Seed is a suite of components (Graph, Model, Schema, Hash) that provide a common API 
for working with JSON-style documents, regardless of the storage engine. By using Seed, 
a Kinetik queue can be stored using any of Seed's storage adapters, including
[Redis](https://github.com/qualiancy/seed-redis) or [MongoDB](https://github.com/qualiancy/seed-mongodb).

[Visit the Seed project page](http://github.com/qualiancy/seed) to learn more, and see alternative storage solutions.

## Quick Start Guide

#### Installation

`kinetik` package is available for node through [npm](http://npmjs.org).

```bash
npm install kinetik
```

#### Choosing a Storage Engine

The first step to using Kinetik is creating a new quueue using one of Seed's storage engines.
In this example we will use Redis with a default configuration.

```javascript
var kinetik = require('kinetik')
  , RedisStore = require('seed-redis')
  , queue = kinetik(new RedisStore());
```

You can use any of Seed's available storage adapters. See that adapater's documentation 
for relevant configuration options. Using a store is optional. If one is not provided, 
Kinetik will default to using an in memory store.

#### Defining Tasks

In Kinetik, a task is a definition on how to process a given job. A job is a specific unit 
of work, and will encapsulate all of the data passed to it.

Here we are going to define our first task, `send email`.

```javascript
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
```

All task definition require a `tag` defined. A tag is an arbitrary string that allows 
us to group common types of jobs together for completion by a single worker process.

The action is the function that will be used invoked to complete each job, it recieves
two arguments.

* The `job` argument for the action will be comprised of all relevant data needed to
complete the task.
* The `done` argument for the action accepts an error object as parameter. If an error 
is sent, it will  flag job as `failed`, otherwise will flag as `complete`.

#### Starting the Processor

In the same node process that has the tasks defined, you will need to start processing. 
Processing is done per tag or group of tags.

```javascript
queue.process('notifications');
```

This will begin processing the `notifications` tag. It will serially process all queued
jobs for that tag and then pause, then wait 10 seconds (see API to change), then query
for more to process. Multiple calls to `process` will create multiple "threads" of processing.
Avoid including the same tag in more than one processing call.

You can also prioritize multiple tags for processing.

```javascript
queue.process([ 'notifications', 'db aggregation' ]);
```

In this scenario, the queue will process all of the notifications, then move on to db
aggregation. If a notification is added to the queue while running a db aggregation
task, it will return to processing notifications at the completion of the current db
task. This behavior will occur even if their are more db tasks to accomplish. In that 
case, there will be no pause. The pause will only happen after all tags assigned for 
processing have been emptied.

#### Adding Jobs

Finally, you will need to create jobs. 

```javascript
queue.create('send email', {
    email: 'ford@hitchhikersguide.com'
  , name: 'Ford Prefect'
  , subject: 'Hello Universe'
});
```

One noteworthy feature of Kinetik is that jobs do
not have to be created with knowledge of the task that will process them. This means
that your task processing codebase does not need to be shared with the part of your 
application that will be creating jobs. As long as jobs are created using the the same
storage specifications as your processing queue, Kinetik will work as expected.

