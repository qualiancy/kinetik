var http = require('http')
  , connect = require('connect')
  , join = require('path').join;

var app = connect();

app.use(connect.staticCache());
app.use(connect.static(join(__dirname, 'out')));

var server = module.exports = http.createServer(app);

if (require.main == module) {
  server.listen(3441);
  console.log('kinetik doc server listening on port %d', server.address().port);
}
