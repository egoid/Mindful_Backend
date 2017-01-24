'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db.js');

const router = new express.Router();
exports.router = router;

router.get('/1/live_jobs', get_live_job_list);
router.post('/1/live_jobs', publish_live_job);
router.put('/1/live_jobs/:id', update_job);

function publish_live_job(req, res) {
  const job_details = req.body;
  console.log(job_details.industry_id)
  const sql = "INSERT INTO job (latitude_lower_walk, longitude_lower_walk, latitude_upper_walk, longitude_upper_walk, latitude_lower_bike, longitude_lower_bike, latitude_upper_bike, longitude_upper_bike, latitude_lower_metro, longitude_lower_metro, latitude_upper_metro, longitude_upper_metro, latitude_lower_car, longitude_lower_car, latitude_upper_car, longitude_upper_car, company_id, employer_id, is_deleted, job_role_id, job_type_id, job_schedule_id, title, location, description, responsibilities, activities, is_yobs_client, external_url, posted_at, deleted_at , industry_id ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  const values = [34.0341, -118.222, 34.0341, -118.222, 34.0341, -118.222, 34.0341, -118.222, 34.0341, -118.222, 34.0341, -118.222, 34.0341, -118.222, 34.0341, -118.222, job_details.company_id , 1, 0, job_details.job_role_id, 1, 1, job_details.job_title, job_details.job_loc, job_details.job_desc, job_details.job_desc, job_details.job_summ, 0, job_details.url, job_details.post_date.slice(0,10) , job_details.expiry_date.slice(0,10) , job_details.industry_id ];
  db.connectAndQuery({sql, values}, (error, results) => {
    console.log(results)
    if(error) {
      console.error("post_new_job: sql err:", error);
      res.sendStatus(500);
    } else {
      
      res.status(200).send({'id' : results.insertId });
    }
  });
}

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
