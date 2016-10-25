'use strict';

const http = require("http");
const util = require('util');

const HTTP_OPTIONS = {
  hostname: 'stage-api.yobs.io',
  port: 80,
  path: '/client/1/employee/tipi/quiz',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Yobs-User-Session-Key': 'A+9sc1EQDYdAqlQQ4lGmkRBSEqklFtU4',
  }
};

const payload = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

const req = http.request(HTTP_OPTIONS, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) { console.log('problem with request: ' + e.message); });
req.write(JSON.stringify(payload));
req.end();
