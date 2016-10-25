'use strict';

const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/industry/:industry_id', get_industry);
router.get('/1/industry', get_all_industry);

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
