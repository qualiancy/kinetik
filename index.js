module.exports = process.env.KINETIK_COV
  ? require('./lib-cov/kinetik')
  : require('./lib/kinetik');
