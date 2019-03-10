let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let rabbitmq = require('./public/javascripts/rabbitmq/transfer-message');
rabbitmq.initRabbitMQ();

let oauthRouter = require('./routes/oauth');
let usersRouter = require('./routes/users');
let roomRouter = require('./routes/room');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let startUrl = '/api/chat';

app.disable('etag');
app.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
app.options('/api/*', function (request, response, next) {
  response.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  response.send();
});
app.use(startUrl + '/', oauthRouter);
app.use(startUrl + '/users', usersRouter);
app.use(startUrl + '/room', roomRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
