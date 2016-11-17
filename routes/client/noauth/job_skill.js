'use strict';

const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/job_skill', get_all_job_skills);
router.get('/1/job_skill/:job_skill_id', get_job_skill);

function get_all_job_skills(req, res) {
  const sql = "SELECT * FROM job_skill LIMIT 500";
  const values = [];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_all_job_skills: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results);
    }
  });
}

function get_job_skill(req, res) {
  const sql = "SELECT * FROM job_skill WHERE job_skill_id = ?";
  const values = [req.params.job_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_job_skill: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
