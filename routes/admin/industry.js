'use strict';

const async = require('async');
const express = require('express');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/industry', create_industry);
router.post('/1/industry/:industry_id', update_industry);
router.delete('/1/industry/:industry_id', delete_industry);

function create_industry(req, res) {
  let industry_id;
  let connection;
  const industry_def = req.body;

  async.series([
    (done) => {
      db.getConnection((error, conn) => {
        if(error) {
          console.error(error);
        }
        connection = conn;
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT industry_id FROM industry WHERE industry_type = ?";
      const values = [industry_def.type];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("create_industry: sql error: " + error);
        } else if(results[0] && results[0].industry_id) {
          industry_id = results[0].industry_id;
        }
        done(error);
      });
    },
    (done) => {
      if(!industry_id) {
        const sql = "INSERT INTO industry (industry_name, industry_type) VALUES (?, ?)";
        const values = [industry_def.name, industry_def.type];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error("_create_company SQL error: " + error);
            block_err = error;
          } else {
            industry_id = results.insertId;
          }
          done(error);
        });
      } else {
        done();
      }
    },
    (done) => {
      db.commit(connection, done);
    }
  ],
  (error) => {
    if(error) {
      db.rollback(connection);
      res.status(500).send({ error });
    } else {
      res.status(200).send({ id: industry_id });
    }
  });
}
function update_industry(req, res) {
  const name = req.body.name;
  const type = req.body.type;

  const sql = "UPDATE industry SET industry_name = ?, industry_type = ? WHERE industry_id = ?";
  const values = [name, type, req.params.industry_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_industry: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_industry(req, res) {
  const sql = "DELETE FROM industry WHERE industry_id = ?";
  const values = [req.params.industry_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_industry: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
