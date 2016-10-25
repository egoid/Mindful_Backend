'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/employee/experience', get_employee_experience);
router.post('/1/employee/experience', create_employee_experience);
router.delete('/1/employee/experience/:experience_id', delete_employee_experience);

function get_employee_experience(req, res) {
  const sql = "SELECT * FROM employee_experience WHERE employee_id = ?";
  const values = [req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_experience: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results);
    }
  });
}
function create_employee_experience(req, res) {
  const employee_id = req.user.employee_id;

  if(!req.body.company || !req.body.job_role_id || !req.body.start_date) {
    res.status(400).send('Company, job role ID, and start date are required.');
  } else {
    const sql = "INSERT INTO employee_experience SET ?";
    const values = {
      employee_id,
      company: req.body.company,
      job_role_id: req.body.job_role_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date || null
    };
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        consle.error(error);
        res.sendStatus(500);
      } else {
        res.status(200).send({id: results.insertId});
      }
    });
  }
}
function delete_employee_experience(req, res) {
  const sql = "DELETE FROM employee_experience WHERE employee_experience_id = ? AND employee_id = ?";
  const values = [req.params.experience_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_experience: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
