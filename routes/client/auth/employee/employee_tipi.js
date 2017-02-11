'use strict';

const async = require('async');
const express = require('express');
const db = require('../../../../mysql_db_prod.js');
const tipi = require('../../../../execs/tipi.js');

const router = new express.Router();
exports.router = router;

router.post('/1/employee/tipi/quiz', tipi_quiz);

router.get('/1/employee/tipi', get_employee_tipi);
router.post('/1/employee/tipi', create_tipi);
router.delete('/1/employee/tipi/:tipi_id', delete_tipi);

function _create_tipi_entry(connection, employee_id, scores, all_done) {
  let tipi_score_id;

  async.series([
    (done) => {
      const values = {
        extraversion: scores.extraversion || 0,
        agreeableness: scores.agreeableness || 0,
        conscientiousness: scores.conscientiousness || 0,
        emotional_stability: scores.emotional_stability || 0,
        openness_to_experiences: scores.openness_to_experiences || 0
      };
      const sql = "INSERT INTO tipi_score SET ?";

      db.queryWithConnection(connection, sql, values, (err, results) => {
        if(err) {
          console.error("_create_tipi_entry: sql err:", err);
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
          console.error("_create_tipi_entry: sql err:", err);
        } else if(results.affectedRows < 1) {
          err = '404';
        }
        done(err);
      });
    }
  ],
  (err) => {
    all_done(err, tipi_score_id);
  });
}

function get_employee_tipi(req, res) {
  const sql = "SELECT tipi_score.* " +
              "FROM tipi_score " +
              "JOIN employee USING(tipi_score_id) " +
              "WHERE employee.employee_id = ?";
  const values = [req.user.employee_id || req.query.employee_id];
  console.log(values)
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
        _create_tipi_entry(connection, employee_id, req.body, (err, result) => {
          if(err) {
            console.error("create_tipi: error:", err);
          }
          tipi_score_id = result;
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
        // res.sendStatus(404);
        res.send([]);
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
  const output = tipi(answers);

  console.log(output)

  const tipi_values = {
    extraversion: output.E ? output.E.score : 0,
    agreeableness: output.A ? output.A.score : 0,
    conscientiousness: output.C ? output.C.score : 0,
    emotional_stability: output.N ? output.N.score : 0,
    openness_to_experiences: output.I ? output.I.score : 0
  };

  console.log(tipi_values)

  let tipi_score_id;
  let connection;

  async.series([
      (done) => {
        db.getConnection((err, conn) => {
          if(err) {
            console.error("tipi_quiz: sql err:", err);
          }
          connection = conn;
          done(err);
        });
      },
      (done) => {
        _create_tipi_entry(connection, req.user.employee_id, tipi_values, (err, result) => {
          if(err) {
            console.error("tipi_quiz: error:", err);
          }
          tipi_score_id = result;
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
