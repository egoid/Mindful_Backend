'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db.js');

const router = new express.Router();
exports.router = router;

router.get('/1/live_jobs', get_live_job_list);
router.put('/1/live_jobs/:id', update_job);

function get_live_job_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * FROM `job`";
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = {};
      for(let i in results){
        let r = results[i];
        if(!sorted[r.job_category]){
          sorted[r.job_category] = [];
        }
        sorted[r.job_category].push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function update_job(req, res) {
  const sql = "SELECT * FROM `live_jobs`";
  const id = req.params.id;
  const values = [req.query.job_type];
  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}

/*
---DO NOT UNCOMMENT---


const imported = require('../../Associates.json');
const fields = '(job_title, company, job_loc, job_summ, salary, job_desc, url, post_date, expiry_date, job_available, job_category)';
const sql = 'INSERT into `raw_jobs` '+ fields +' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
for(let i in imported){
  let doc = imported[i];
  delete doc.id;
  doc.job_category = 'Associates';
  let values = [doc.job_title, doc.company, doc.job_loc, doc.job_summ, doc.salary, doc.job_desc, doc.url, doc.post_date, doc.expiry_date, doc.job_available, doc.job_category];
  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
    } else {
      console.log('Saved '+doc.job_title);
    }
  });
}*/
