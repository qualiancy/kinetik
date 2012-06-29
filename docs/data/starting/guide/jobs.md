---
  title: Adding Jobs
  render-file: false
  weight: 50
---

### Adding Jobs

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

