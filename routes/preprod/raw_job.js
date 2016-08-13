'use strict';

const _ = require('lodash');
const express = require('express');
const util = require('../../util.js');
const db = require('../../mysql_db.js');

const router = new express.Router();
exports.router = router;

router.get('/1/job_types', get_job_types)
router.get('/1/jobs', get_job_list);

function get_job_types(req, res) {
  const sql = "SHOW TABLES";
  db.connectAndQuery({ sql }, (error, results) => {
    if(error) {
      util.errorLog(error);
      res.sendStatus(500);
    } else {
      const table_result = _.pluck(results, 'Tables_in_yobs_tech_admin_tool_v2');
      res.status(200).send(table_result);
    }
  });
}
function get_job_list(req, res) {
  const sql = "SHOW TABLES";
  const table = req.query.job_type;
  db.connectAndQuery({ sql }, (error, results) => {
    if(error) {
      util.errorLog(error);
      res.sendStatus(500);
    } else {
      const table_result = _.pluck(results, 'Tables_in_yobs_tech_admin_tool_v2');
      if(table_result.indexOf(table) != -1) {
        const job_list_sql = "SELECT * FROM `" + table + "`";
        db.connectAndQuery({sql: job_list_sql}, (error, results) => {
          if(error) {
            util.errorLog(error);
            res.sendStatus(500);
          } else {
            res.status(200).send(results);
          }
        });
      } else {
        util.errorLog("Table (" + table + ") not found");
        res.sendStatus(500);
      }
    }
  });
}
