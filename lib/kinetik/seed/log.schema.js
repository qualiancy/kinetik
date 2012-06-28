/*!
 * kinetik - log schema
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed')
  , Type = Seed.Schema.Type

/*!
 * Seed.Schema definition
 */

module.exports = new Seed.Schema({

    _id: {
        type: Type.ObjectId
      , index: true
    }

  , job: Type.DBRef

  , msg: String

  , data: Object

  , timestamp: {
        type: Number
      , default: new Date().getTime()
    }

});
