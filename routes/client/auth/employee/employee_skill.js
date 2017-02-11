'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/employee/skill', get_employee_skill);
router.post('/1/employee/skill', create_employee_skill);
router.delete('/1/employee/skill/:employee_skill_id', delete_employee_skill);

function get_employee_skill(req, res) {
  const sql = "SELECT * FROM employee_skill WHERE employee_id = ?";
  const values = [req.user.employee_id];
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
function create_employee_skill(req, res) {
  const employee_id = req.user.employee_id;
  const skill_type_id = req.body.skill_type_id;

  const sql = "INSERT INTO employee_skill SET ?";
  const values = { employee_id, skill_type_id };

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_employee_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_employee_skill(req, res) {
  const sql = "DELETE FROM employee_skill WHERE employee_skill_id = ? AND employee_id = ?";
  const values = [req.params.employee_skill_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_skill: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
