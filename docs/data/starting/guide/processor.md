---
  title: Starting the Processor
  render-file: false
  weight: 40
---

### Starting the Processor

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
