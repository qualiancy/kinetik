

exports.version = '0.0.5';

exports.Queue = require('./kinetik/queue');
exports.Job = require('./kinetik/job')

exports.createQueue = function (options) {
  var queue = new exports.Queue(options);
  return queue;
};
