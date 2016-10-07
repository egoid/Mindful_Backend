
var async = require('async');
var express = require('express');
var multipart = require('connect-multiparty');
var http = require('http');
var morgan = require('morgan');
var method_override = require('method-override');
var body_parser = require('body-parser');
var cookie_parser = require('cookie-parser');
var errorhandler = require('errorhandler');

// Local Files
var routes = require('./routes');
var config = require('./config.json');
var util = require('./util.js');

var app = express();
var is_development = app.get('env') == 'development';

app.enable('trust proxy')
app.set('port', process.env.PORT || 3020);

if(is_development) {
  app.use(morgan('[:date] :method :url :status :res[content-length] - :response-time ms'));
} else {
  app.use(morgan(':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :response-time(ms) ":referrer" ":user-agent"'));
}
app.use(allow_cross_domain);
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(multipart());
app.use(cookie_parser());
app.use(method_override());
app.use(routes.router);
app.use(my_error_handler);

http.createServer(app).listen(app.get('port'),function() {
  console.log('Express server listening on port ' + app.get('port'));
});

function allow_cross_domain(req,res,next) {
  if (req.headers.origin || req.method == 'OPTIONS') {
    if (req.headers.origin) {
      res.header("Access-Control-Allow-Origin",req.headers.origin);
    } else {
      res.header("Access-Control-Allow-Origin","*");
    }
    res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers",
      "Content-Type,Accept,X-Requested-With,X-HTTP-Method-Override,X-Yobs-API-Key,X-Yobs-User-Session-Key,X-Yobs-Admin-Session-Key");
    res.header("Access-Control-Max-Age","3600");
  }

  if (req.method == 'OPTIONS') {
    res.header("Cache-Control","public, max-age=3600");
    res.header("Vary","Origin");
    res.sendStatus(204);
  } else {
    next();
  }
}
function my_error_handler(err,req,res,next) {
  if (err && err.code && err.body && typeof err.code === 'number') {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Content-Type","text/plain");
    res.status(err.code).send(err.body.toString());
  } else if( is_development ) {
    errorhandler()(err,req,res,next);
  } else {
    util.errorLog("Middleware err:",err);
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendStatus(500);
  }
}
