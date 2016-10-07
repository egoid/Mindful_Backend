'use strict';

const http = require("http");
const HTTP_OPTIONS = {
  hostname: 'localhost',
  port: 3020,
  path: '/1/user/login',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
};

const payload = { email: 'test04@testing.com', password: 'password' };

const req = http.request(HTTP_OPTIONS, function(res) {
  console.log('STATUS: ' + res.statusCode);
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) { console.log('problem with request: ' + e.message); });
req.write(JSON.stringify(payload));
req.end();
