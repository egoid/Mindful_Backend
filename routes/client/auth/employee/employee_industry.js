'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/employee/industry', get_employee_industry);
router.post('/1/employee/industry', create_employee_industry);
router.delete('/1/employee/industry/:employee_industry_id', delete_employee_industry);

function get_employee_industry(req, res) {
  const sql = "SELECT industry.*, employee_interested_industry.* " +
              "FROM employee_interested_industry " +
              "JOIN industry USING(industry_id) " +
              "WHERE employee_id = ?";
  const values = [req.user.employee_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_industry: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      // res.sendStatus(404);
      res.status(200).send([]);
    } else {
      res.status(200).send(results);
    }
  });
}
function create_employee_industry(req, res) {
  const employee_id = req.user.employee_id;
  const industry_id = req.body.industry_id;

  if(!employee_id || !industry_id) {
    res.sendStatus(400);
  } else {
    const sql = "INSERT INTO employee_interested_industry SET ?";
    const values = {employee_id, industry_id};
    db.connectAndQuery({sql, values}, (err, results) => {
      if(err) {
        console.error("create_employee_industry: sql err:", err);
        res.sendStatus(500);
      } else {
        res.status(200).send({id: results.insertId});
      }
    });
  }
}
function delete_employee_industry(req, res) {
  const sql = "DELETE FROM employee_interested_industry " +
              "WHERE employee_industry_id=? AND employee_id=?";
  const values = [req.params.employee_industry_id, req.user.employee_id];

  db.connectAndQuery({sql, values}, (err, results) => {
    if(err) {
      console.error("delete_employee_industry: sql err:", err);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
