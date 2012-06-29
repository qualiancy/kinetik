---
  title: Kinetik
---

#### Features

- storage-agnostic, thanks to [seed](https://github.com/qualiancy/seed)
- distribute workers across processes and servers
- tag and priority based processing
- middleware capable
- cli management suite
- job delays
- per-job logging
- chainable api

#### Philosophy

Simple tasks such as sending transactional emails and mobile notifications should be handled as
quickly as possible. Other tasks such as database analytics, adaptive re-keys, and media encoding
should occur when their are dedicated resources available. Kinetik's goal is to provide the 
framework necissary to handle both ends of the spectrum with simplicity and agility so your 
app can keep moving.

#### What is Seed?

Seed is a suite of components (Graph, Model, Schema, Hash) that provide a common API 
for working with JSON-style documents, regardless of the storage engine. By using Seed, 
a Kinetik queue can be stored using any of Seed's storage adapters. 

[Visit the Seed project page](http://github.com/qualiancy/seed) to learn more, and see alternative storage solutions.
Seed API documentation is in the works, so hold steady.

Kinetik currently supports [Redis](https://github.com/qualiancy/seed-redis) or 
[MongoDB](https://github.com/qualiancy/seed-mongodb). Stay tuned for developments 
regarding Riak and CouchDB. Need something else? The Seed Storage API will make it easy to 
integrate with your storage engine of choice.
