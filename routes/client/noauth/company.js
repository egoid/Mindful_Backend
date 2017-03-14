'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/company', get_companies);
router.get('/1/company/:company_id', get_company);
router.post('/1/company/:company_id', edit_company);

function get_company(req, res) {
  const company_id = req.params.company_id;
  const sql = "SELECT company.*, job.* FROM company JOIN job USING(company_id) WHERE company_id = ? " 
  const values = [company_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      res.sendStatus(500);
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

function edit_company(req, res) {
  const sql = "UPDATE company SET company_descr=?, video_url=? WHERE company_id=?";
  const values = [req.body.company_descr, req.body.video_url, req.params.company_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_shift_type: sql err:", error);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}