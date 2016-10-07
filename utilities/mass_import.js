'use strict';

const _ = require('lodash');
const async = require('async');
const db = require('./mysql_db_prod.js');
const util = require('./util.js');
const http = require("http");

const HTTP_OPTIONS = {
  hostname: 'yobapi.ms6dfu3he5.us-west-2.elasticbeanstalk.com',
  port: 80,
  path: '/prod/1/job',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const tables = [ 'After School Teacher', 'Associates', 'Bar tenders', 'Barista',
  'Blogger', 'Brand Ambassador', 'Cafeteria Worker', 'Campus Tour Guide',
  'Cashier', 'Child Care', 'Driver', 'Entertainment', 'Food Prep',
  'Food Service', 'Food Truck', 'Front Desk', 'Hospitality', 'Host', 'Ice Cream',
  'Juice Maker', 'Library Assistant', 'Lifeguard', 'Marketing Intern', 'Part time jobs',
  'Personal Assistant', 'Pet Care', 'Promoter', 'Research Assistant', 'Resident Adviser',
  'Retail Sales Associate', 'Retails', 'Sales', 'Sales Intern', 'Server',
  'Sharing Economy Jobs', 'Smoothie Maker', 'Social Media Manager', 'Sports',
  'Summer jobs', 'Tutor', 'Waiter'];

async.eachSeries(tables, (table, done) => {
  const sql = "SELECT * FROM `" + table + "` WHERE job_available > 0";
  db.connectAndQuery({ sql }, (error, results) => {
    process_table_result(table, results, done);
  });
},
(error) => {
  console.log("All done");
  process.exit();
});

function process_table_result(tableName, results, callback) {
  async.eachSeries(results, (result, done) => {
      const payload = {
        company: {
          name: result.company,
          industry: {
            name: "Hospitality",
            type: "Hospitality"
          }
        },
        job_role: {
          name: tableName,
          type: tableName
        },
        job_type: {
          name: "Hospitality",
          type: "Hospitality"
        },
        title: result.job_title,
        description: result.job_desc,
        responsibilities: result.job_summ,
        activities: result.job_summ,
        external_url: result.url,
        posted_at: result.post_date,
        takedown_at: result.expiry_date,
        location: result.job_loc
      };
      const req = http.request(HTTP_OPTIONS, function(res) {
        console.log('Status: ' + res.statusCode);
        done();
      });
      req.on('error', function(e) { console.log('problem with request: ' + e.message); });
      req.write(JSON.stringify(payload));
      req.end();
  },
  (err) => {
    callback(err);
  });
}
