'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/company', get_companies);
router.get('/1/company/:company_id', get_company);

function get_company(req, res) {
  const company_id = req.params.company_id;
  const sql = "SELECT * FROM company WHERE company_id = ?";
  const values = [company_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function get_companies(req, res) {
  const sql = "SELECT * FROM company";
  const values = [];
  const final_results = [];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      res.sendStatus(500);
    } else {
      _.each(results, (result) => {
        final_results.push(result);
      });
      res.status(200).send(final_results);
    }
  });
}
