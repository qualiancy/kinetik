exports.colorize = function () {
  var colors = {
      'red': '\u001b[31m'
    , 'green': '\u001b[32m'
    , 'yellow': '\u001b[33m'
    , 'blue': '\u001b[34m'
    , 'magenta': '\u001b[35m'
    , 'cyan': '\u001b[36m'
    , 'gray': '\u001b[90m'
    , 'reset': '\u001b[0m'
  };

  Object.keys(colors).forEach(function (color) {
    Object.defineProperty(String.prototype, color,
      { get: function () {
          return colors[color]
            + this
            + colors['reset'];
        }
    });
  });
};

exports.header = function () {
  exports.colorize();
  console.log('');
  console.log('  Welcome to ' + 'Kinetik'.gray);
  console.log('  It worked if it ends with ' + 'Kinetik'.gray + ' ok'.green);
};

exports.footerOk = function () {
  console.log('  ' + 'Kinetik '.gray + 'ok'.green);
  console.log('');
  process.exit();
};

exports.footerNotOk = function () {
  console.log('  ' + 'Kinetik '.gray + 'not ok'.red);
  console.log('');
  process.exit(1);
};
