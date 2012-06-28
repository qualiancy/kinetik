/*!
 * kinetik - log model
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , debug = require('debug')('kinetik:log');

/*!
 * Model dependancies
 */

var LogSchema = require('./log.schema');

/*!
 * Extend Seed.Model
 */

module.exports = Seed.Model.extend('job', {

    schema: LogSchema

});
