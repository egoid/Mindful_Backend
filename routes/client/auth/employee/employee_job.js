'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

const EMPLOYEE_JOB_STATUS = ['saved','submitted','reviewed','interview','offer','pass'];

router.get('/1/employee/job', get_employee_jobs);
router.post('/1/employee/job', create_employee_job);
router.post('/1/employee/job/:employee_job_id', update_employee_job);
router.delete('/1/employee/job/:employee_job_id', delete_employee_job);

function get_employee_jobs(req, res) {
  const sql = "select * from job_role"
  // const sql = "SELECT employee_job.*, job.* FROM employee_job JOIN job USING(job_id) WHERE employee_id = ?";
  // const values = [req.user.employee_id];
  const values = [1];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_jobs: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results)
    }
  });
}
function create_employee_job(req, res) {
  const employee_id = req.user.employee_id;
  const job_id = req.body.job_id;
  const interview_date = req.body.interview_date;
  let status = req.body.status;

  if(EMPLOYEE_JOB_STATUS.indexOf(status) < 0) {
    status = NULL;
  }

  const sql = "INSERT INTO employee_job SET ?";
  const values = { employee_id, job_id, status, interview_date };

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_employee_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send({id: results.insertId});
    }
  });
}
function update_employee_job(req, res) {
  const employee_job_id = req.params.employee_job_id;
  const interview_date = req.body.interview_date || NULL;
  let job_status = req.body.status;

  if(EMPLOYEE_JOB_STATUS.indexOf(job_status) < 0) {
    job_status = NULL;
  }

  const sql = "UPDATE employee_job SET status = ?, interview_date = ? WHERE employee_job_id = ? AND employee_id = ?";
  const values = [job_status, interview_date, employee_job_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_employee_job: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_employee_job(req, res) {
  const sql = "DELETE FROM employee_job WHERE employee_job_id = ? AND employee_id = ?";
  const values = [req.params.employee_job_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_job: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
