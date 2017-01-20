'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db.js');

const router = new express.Router();
exports.router = router;

router.get('/1/raw_jobs/job_list/', get_job_list);
router.get('/1/raw_jobs/live_list/', get_live_list);
router.put('/1/raw_jobs/job_list/', edit_job);

router.get('/1/raw_jobs/role_list/', get_role_list);
router.get('/1/raw_jobs/company_list/', get_company_list);
router.get('/1/raw_jobs/industry_list/', get_industry_list);
router.get('/1/raw_jobs/skill_list/', get_skill_list);
router.get('/1/raw_jobs/employer_list/', get_employer_list);
router.get('/1/raw_jobs/schedule_list/', get_schedule_list);
router.get('/1/raw_jobs/job_type_list/', get_job_type_list);
// router.put('/1/raw_jobs/:id', update_job);

function get_job_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from raw_jobs_2017" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}


function get_live_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from job" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {  
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function edit_job(req, res) {
  const this_job = req.body;
  var criteria = this_job['edit_criteria_string']
  const arg_map = {}
  arg_map[criteria] = this_job[criteria]
  console.log(arg_map)
  const sql = "UPDATE job SET ? WHERE job_id = ? " 
  const values = [ arg_map , this_job.job_id ]

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });

};

function get_industry_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from industry" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_skill_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from job_skill" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_employer_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from employer" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_schedule_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from job_schedule" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}


function get_job_type_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from job_type" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}




function get_role_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from job_role" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}


function get_company_list(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT * from company" 
  if(category){
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      const sorted = [];
      for(let i in results){
        let r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function update_job(req, res) {
  const sql = "SELECT * FROM `raw_jobs`";
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
