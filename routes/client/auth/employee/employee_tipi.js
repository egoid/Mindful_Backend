'use strict';

const async = require('async');
const express = require('express');
const db = require('../../../../mysql_db_prod.js');
const exec = require('child_process').exec;

const router = new express.Router();
exports.router = router;

router.post('/1/employee/tipi/quiz', tipi_quiz);

router.get('/1/employee/tipi', get_employee_tipi);
router.post('/1/employee/tipi', create_tipi);
router.delete('/1/employee/tipi/:tipi_id', delete_tipi);

function get_employee_tipi(req, res) {
  const sql = "SELECT tipi_score.* " +
              "FROM tipi_score " +
              "JOIN employee USING(tipi_score_id) " +
              "WHERE employee.employee_id = ?";
  const values = [req.user.employee_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_tipi: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function create_tipi(req, res) {
  const employee_id = req.user.employee_id;

  if(!employee_id) {
    res.sendStatus(400);
  } else {
    let connection;
    let tipi_score_id;

    async.series([
      (done) => {
        db.getConnection((err, conn) => {
          if(err) {
            console.error("create_tipi: sql err:", err);
          }
          connection = conn;
          done(err);
        });
      },
      (done) => {
        const values = {
          extraversion: req.body.extraversion || 0,
          agreeableness: req.body.agreeableness || 0,
          conscientiousness: req.body.conscientiousness || 0,
          emotional_stability: req.body.emotional_stability || 0,
          openness_to_experiences: req.body.openness_to_experiences || 0
        };
        const sql = "INSERT INTO tipi_score SET ?";

        db.queryWithConnection(connection, sql, values, (err, results) => {
          if(err) {
            console.error("create_tipi: sql err:", err);
          } else {
            tipi_score_id = results.insertId;
          }
          done(err);
        });
      },
      (done) => {
        const sql = "UPDATE employee SET tipi_score_id = ? WHERE employee_id = ?";
        const values = [tipi_score_id, employee_id];
        db.queryWithConnection(connection, sql, values, (err, results) => {
          if(err) {
            console.error("create_tipi: sql err:", err);
          } else if(results.affectedRows < 1) {
            err = '404';
          }
          done(err);
        });
      },
      (done) => {
        db.commit(connection, done);
      }
    ],
    (err) => {
      if(err == '404') {
        db.rollback();
        res.sendStatus(404);
      } else if(err) {
        db.rollback();
        res.sendStatus(500);
      } else {
        res.send({id: tipi_score_id });
      }
    });
  }
}
function delete_tipi(req, res) {
  const sql = "DELETE FROM tipi_score WHERE tipi_score_id=? AND employee_id=?";
  const values = [req.params.tipi_score_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_tipi: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}

function tipi_quiz(req, res) {
  const answers = req.body;
  answers.unshift(0);

  const cmd = "execs/ipip " + JSON.stringify(answers);
  exec(cmd, (err, stdout, stderr) => {
    if(err) {
      console.error(err);
      res.sendStatus(500);
    } else if(stderr) {
      console.error(stderr);
      res.sendStatus(500);
    } else {
      const output = JSON.parse(stdout);
      res.sendStatus(200);
    }
  });
}
