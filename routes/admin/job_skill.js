'use strict';

const express = require('express');
const db = require('../../mysql_db_prod.js');
const router = new express.Router();

exports.router = router;

router.post('/1/job/:job_id/skill', create_job_skill);
router.delete('/1/job_skill/:job_skill_id', delete_job_skill);

function create_job_skill(req, res) {
  const job_id = req.params.job_id;
  const skill_type_id = req.body.skill_type_id;

  const sql = "INSERT INTO job_skill (job_id, skill_type_id) VALUES (?,?)";
  const values = [job_id, skill_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_job_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results.insertId);
    }
  });
}
function delete_job_skill(req, res) {
  const sql = "DELETE FROM job_skill WHERE job_skill_id = ?";
  const values = [req.params.job_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_job_skill: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
