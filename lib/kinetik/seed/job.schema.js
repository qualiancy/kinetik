/*!
 * kinetik - job schema
 * Copyright(c) 2012 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * External module dependancies
 */

var Seed = require('seed');

/*!
 * Seed.Schema definition
 */

module.exports = new Seed.Schema({

    _id: {
        type: Number
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

  , status: {
        type: String
      , required: true
    }

});
