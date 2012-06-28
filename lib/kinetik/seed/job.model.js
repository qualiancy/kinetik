/*!
 * kinetik - job model
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , debug = require('debug')('kinetik:job');

/*!
 * Model dependancies
 */

var JobSchema = require('./job.schema');

/*!
 * Extend Seed.Model
 */

module.exports = Seed.Model.extend('job', {

    schema: JobSchema

});
