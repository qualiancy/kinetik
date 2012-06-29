---
  title: Choosing a Storage Engine
  render-file: false
  weight: 20
---

### Choosing a Storage Engine

The first step to using Kinetik is creating a new queue using one of Seed's storage engines.
In this example we will use Redis with a default configuration.

```javascript
var kinetik = require('kinetik')
  , RedisStore = require('seed-redis')
  , queue = kinetik(new RedisStore());
```

You can use any of Seed's available storage adapters. See that adapater's documentation 
for relevant configuration options. Using a store is optional. If one is not provided, 
Kinetik will default to using an in memory store.

