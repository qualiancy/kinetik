/*!
 * kinetik - job schema
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

  , task: {
        type: String
      , required: true
      , index: true
    }

  , data: Object

  , created: {
        type: Number
      , default: new Date().getTime()
    }

  , delay: Number

  , status: {
        type: Type.Select
      , required: true
      , allowed: [
            'queued'
          , 'delayed'
          , 'processing'
          , 'completed'
          , 'failed'
          , 'cancelled'
          , 'timeout'
        ]
    }

  , error: Object

});
