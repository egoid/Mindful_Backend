'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');
const router = new express.Router();
exports.router = router;

router.get('/1/employer', get_employer);
router.get('/1/employer/job', get_employer_jobs_by_employer);


function get_employer(req, res) {
  const sql = "SELECT employer.*, user.email AS employee_name " +
              "FROM employer " +
              "JOIN user USING(user_id) " +
              "WHERE employer_id = ?";
  const values = [1];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employer: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function get_employer_jobs_by_employer(req, res) {
  const sql = "SELECT job.* FROM job WHERE employer_id = ?";
  const values = [req.user.employer_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employer_jobs_by_employer: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results);
    }
  });
}
