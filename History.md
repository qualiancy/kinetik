
0.3.1 / 2012-09-26 
==================

  * Cli middleware bad file references. Closes #22

0.3.0 / 2012-09-04 
==================

  * Merge branch 'feature/idris'
  * remove reference to internal utils
  * remove ms util
  * add idris to deps
  * refactor cli deps into middleware folder
  * refactor queue._tasks as queue.tasks. Closes #21
  * update docs

0.2.1 / 2012-07-11 
==================

  * Merge pull request #19 from pgherveou/master
  * clean commit for retry task patch

0.2.0 / 2012-07-10 
==================

  * update docs with better example
  * more info in example guide/tasks
  * doc typo. Closes #14
  * Merge branch 'bug/gh-13'
  * fix debug messages. Closes #13
  * fix retry test referencing non-existing data
  * remove strange chars from task model
  * Merge branch 'bug/gh-15'
  * make cancel callback optional
  * Merge pull request #16 from pgherveou/master
  * delay

0.1.0 / 2012-06-29 
==================

  * final doc commit
  * readme
  * doc tweaks and connect app for deployment
  * add qualiancy logo to docs
  * code cleanup
  * create/cancel create log items
  * add screenshots to docs
  * clean up cli example for screenshots
  * Merge branch 'feature/finish-docs'
  * add section for middleware and resources
  * docs for Task API
  * support pages after code on docs
  * Merge branch 'feature/cli'
  * add clean command to cli
  * code cleanup
  * clean support tags/statuses and will also remove logs
  * bug fix for jobs cli
  * using seed async for jobs cli command
  * clean in makefile
  * a little bit of clean up
  * Merge branch 'feature/progress'
  * processor uses `push` instead of `save` to batch the logs + job changes on done
  * refactor processor main function to handle log and progress events
  * change msg to message in log schema
  * remove job model cancel test
  * wrong type for log model
  * add log model/schema
  * remove job `cancel` method
  * Merge branch 'feature/docs'
  * doc themeing
  * Merge branch 'refactor/0.1.0'
  * update docs
  * all tests passing
  * seed models/schemas seed 0.4.x compatible
  * processor graph emits correct events
  * update how construction arguments are handled
  * support for job timeouts. Closes #8
  * processor handles all types of success/failure events
  * update deps
  * job error store object which includes message and code
  * bug fix in queue#cancel that would not allow cancel by id
  * doc defining tasks
  * electron 0.2.0 compatibility
  * dependency update
  * comments proofread
  * refactor job cancelling
  * cli middleware + example
  * refactor main export as queue factory
  * added task description
  * adding docs
  * comment updates
  * ocd
  * moved processing a job off of the job model and on to the processor
  * refactor queue, removing public access to processor
  * test integration mode for db tests
  * refactored tests for to test execution on each storage
  * timeout for tests at 10seconds
  * added error to job schema
  * refactor Job#process to emit events after job status has been saved
  * fixture and tests for each type of store
  * making redis store a dev dependancy
  * queue no longer using RedisStore as default store
  * job schema updated to use Type.ObjectId
  * existing tests comply with seed async storage mechanisms
  * Task comments for documentation
  * Queue#processTask / Queue#processTag are now truly private functions
  * comments for Queue#process
  * update tests for Queue#fetch
  * Queue#fetch now returns `jobs` hash in callback
  * clean up configure
  * Queue#use looks for a handle function
  * test sets env var manually
  * task modules supports timeout #8
  * ocd
  * schema supports delayed jobs
  * drop drip to use Seed.EventEmitter (based on Drip)
  * Added Job Schema
  * rearrange file structure

0.0.11 / 2012-05-25 
==================

  * example output
  * dependency updates

0.0.10 / 2012-05-22 
==================

  * added id to job action callback

0.0.9 / 2012-03-14 
==================

  * new redis options

0.0.8 / 2012-03-14 
==================

  * updated to seed-redis 0.3.x
  * test-cov makefile
  * test for queue#configure
  * tests for queue#tags
  * added Queue#tags getter
  * tests use shorter interval
  * improved processing interval support
  * Queue#configure for environment based configurations
  * clean env middleware
  * added travis to read me [ci-skip]
  * added travis support
  * added test coverage support

0.0.7 / 2012-03-08 
==================

  * tests for clean. Closes #2
  * Queue#clean. #2
  * cancel notes. Closes #3
  * allow jobs to be cancelled
  * job status set to `processing` during while running action

0.0.6 / 2012-03-08 
==================

  * tests for Queue#fetch
  * Queue#fetch for direct seed.graph access
  * Merge branch 'feature/middleware'
  * updated basic example with environment middleware
  * added environment middleware #6
  * added Queue#use. #6
  * added middleware loader. #6
  * comment ms utility. Closes #4
  * test for stringed delay
  * added ms convert util

0.0.5 / 2012-03-07 
==================

  * Merge branch 'feature/delays'
  * refactor + new tests for delayed jobs
  * refactor queue#processTask to support delayed jobs
  * queue events
  * refactor job for event testing and error storage
  * added chai-spies for event testing
  * added delay

0.0.4 / 2012-03-07 
==================

  * more debug options

0.0.3 / 2012-03-05 
==================

  * update + new examples
  * queue has drain event for creation
  * refactor basic example
  * seed 0.2.x compat
  * update seed deps

0.0.2 / 2012-02-12 
==================

  * basic tests
  * change main export
  * commenting
  * improved options parsing for Queue#store
  * context bug with last
  * if action done sends err back, job marked as failed

0.0.1 / 2012-02-11 
==================

  * read me again
  * read me tweaks
  * readme updates
  * added an example
  * queue can process!
  * added debug module
  * initialized processor graph
  * initialized models
  * initial commit
