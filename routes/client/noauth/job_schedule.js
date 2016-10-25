'use strict';

const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/job_schedule/:job_sched_id', get_job_sched);

function get_job_sched(req, res) {
  const sql = "SELECT * FROM job_schedule WHERE job_schedule_id = ?";
  const values = [req.params.job_sched_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_job_sched: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
