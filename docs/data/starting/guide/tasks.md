---
  title: Defining Tasks
  render-file: false
  weight: 30
---

### Defining Tasks

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

    myAsyncMailer(email, subject, body, function (err) {
      if (err) return done(err);
      // do more things if needed.
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
