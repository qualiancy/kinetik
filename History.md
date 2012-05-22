
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
