'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/employer/skill', get_employer_skill);
router.get('/1/employer/skill_list', get_skill_list);
router.post('/1/employer/skill', create_employer_skill);
router.delete('/1/employer/skill', delete_employer_skill);

function get_employer_skill(req, res) {
  const sql = "SELECT * FROM job_skill WHERE job_id = ?";
  const values = [req.query.job_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employer_skill: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      // res.sendStatus(404);
      res.status(200).send([]);
    } else {
      res.status(200).send(results);
    }
  });
}

function get_skill_list(req, res) {
  const sql = "SELECT * FROM skill_type";
  const values = [];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_skill: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      // res.sendStatus(404);
      res.status(200).send([]);
    } else {
      res.status(200).send(results);
    }
  });
}

function create_employer_skill(req, res) {
  const job_id = req.body.job_id;
  const skill_type_id = req.body.skill_type_id;

  const sql = "INSERT INTO job_skill SET ?";
  const values = { job_id, skill_type_id };

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_employer_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_employer_skill(req, res) {
  const sql = "DELETE FROM job_skill WHERE job_id = ?";
  const values = [req.query.job_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employer_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
