'use strict';

const http = require("http");
const util = require('util');

const HTTP_OPTIONS = {
  hostname: 'localhost',
  port: 3020,
  path: '/client/1/employee/schedule',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Yobs-User-Session-Key': 'PRABA6YSg2v7C1c2w3fDnTuLlyIyYK0y',
  }
};

const payload = { schedule: ['none','all','all','all','all','all','none'] };

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