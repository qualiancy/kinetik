

exports.version = '0.0.1';

exports.Queue = require('./kinetik/queue');
exports.Task = require('./kinetik/task');

exports.createQueue = function (options) {
  var queue = new exports.Queue(options);
  return queue;
};
