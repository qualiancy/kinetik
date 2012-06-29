---
  title: Resources
  render-file: false
  weight: 70
---

## Resources

#### Tests

Tests are writting in [Mocha](http://github.com/visionmedia/mocha) using 
the [Chai](http://chaijs.com) `should` BDD assertion library. To make sure you 
have that installed, clone this repo, install dependacies using `npm install`.

```bash
make test
```

By default, Kinetik will use a MemoryStore to task all of its functionality.
You can also test database integration with Redis and MongoDB. Make sure that you
have both installed locally and setup with default configs without authentication.

```bash
make test-int
```

The tests will aggressively clean up after themselves. Mongo will remove the collection 
that it created and Redis with flush the default database. You may alter this behavior 
by commenting out a few lines in `test/storage.js`.

#### Contributors

Interested in contributing? Fork to get started. Contact [@logicalparadox](http://github.com/logicalparadox) 
if you are interested in being regular contributor.

* Jake Luer ([@logicalparadox](http://github.com/logicalparadox))

#### License

(The MIT License)
