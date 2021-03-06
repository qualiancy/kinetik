---
  title: CLI
  render-file: false
  weight: 30
---

### Command-line Interface

The command-line interface works best when paired with the `environment` middleware.
Since `node queue.js` won't do anything without the `QUEUE` environment variable, you
are free to use those calls for other things, such as performing maintainance and getting
statistics.

##### Setup

Rather simple, really:

```js
queue.use(kinetik.environment());
queue.use(kinetik.cli());
```

Now you are free to use that file as your CLI. Assuming `queue.js` was your file:

```bash
node queue.js --help
```

![Kinetik --help](/public/img/kinetik.help.png)

#### Commands

##### tasks

Get a list of all of the tasks for this queue:

![Kinetik tasks](/public/img/kinetik.tasks.png)

##### jobs

Get a list of all of the jobs in this queue. Also shows a breakdown of the current status
of each job by task.

![Kinetik jobs](/public/img/kinetik.jobs.png)

##### clean

Clean jobs of a given status, optionally by tag. Will default to `completed` if no
status option is provided. Furthermore, all logs associated with the jobs removed will
also be removed.

![Kinetik clean](/public/img/kinetik.clean.png)
