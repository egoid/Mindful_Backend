'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');
const industry_util = require('../industry.js');

const router = new express.Router();
exports.router = router;

router.post('/1/industry', create_industry);
router.get('/1/industry/:industry_id', get_industry);
router.put('/1/industry/:industry_id', update_industry);
router.delete('/1/industry/:industry_id', delete_industry);

router.get('/1/industry', get_all_industry);

function create_industry(req, res) {
  let industry_id;
  let connection;

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
      industry_util.create_industry(req.body, connection, (error, id) => {
        if(error) {
          console.error(error);
        }
        industry_id = id;
        done(error);
      });
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
function get_industry(req, res) {
  const sql = "SELECT * FROM industry WHERE industry_id = ?";
  const values = [req.params.industry_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_industry: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
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

function get_all_industry(req, res) {
  const sql = "SELECT * FROM industry";
  db.connectAndQuery({sql}, (error, results) => {
    if(error) {
      console.error("get_all_industry: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
