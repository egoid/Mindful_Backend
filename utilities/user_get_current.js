'use strict';

const http = require("http");
const util = require('util');

const HTTP_OPTIONS = {
  hostname: 'localhost',
  port: 3020,
  path: '/prod/1/user/current',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Yobs-User-Session-Key': 'PIM8pbPfK83HKTk2plc52lvGwnSgmwXz',
  }
};

const req = http.request(HTTP_OPTIONS, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) { console.log('problem with request: ' + e.message); });
req.end();
