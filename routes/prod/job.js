'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const ejs = require('ejs');
const config = require('node-config-sets');

const db = require('../../mysql_db.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

const SINGLE_JOB_URL = '/1/job/:job_id';

router.get('/1/jobs', get_jobs);
router.post('/1/job', create_job);
router.put(SINGLE_JOB_URL, update_job);
router.delete(SINGLE_JOB_URL, delete_job);
router.get(SINGLE_JOB_URL, get_job);

function _extract_job_def(req) {
  return {
    title: req.body.title,
    location: req.body.location,
    pay_rate_min: req.body.pay_rate_min,
    pay_rate_max: req.body.pay_rate_max,
    min_gpa: req.body.min_gpa,
    description: req.body.description,
    external_url: req.body.external_url,
    posted_at: req.body.posted_at,
    takedown_at: req.body.takedown_at
  };
}
function _create_company(company_def, all_done) {
  if(company_def.id) {
    console.log('All done in _create_company');
    all_done(null, company_def.id);
  } else {
    console.log('Creating a company in _create_company');
    let industry_id;
    async.series([
      (done) => {
        _create_industry(company_def.industry, (error, result) => {
          if(error) {
            util.errorLog(error);
          } else {
            industry_id = result;
          }
          done(error);
        });
      },
      (done) => {
        const insert_query =
    "INSERT INTO company (name, industry_id, email_domain, property_bag) " +
    "VALUES ($1, $2::int, $3, $4::json)";
        const values = [company_def.name, industry_id, company_def.email_domain, company_def.property_bag];

        db.queryWithArgMapFromPool(insert_query, values, (error, results) => {
          let company_id;
          if(error) {
            util.errorLog("_create_company SQL error: " + error);
          } else {
            company_id = results.insertId;
          }
          done(error, company_id);
        });
      }
    ],
    (error, company_id) => {
      all_done(error, company_id);
    });
  }
}
function _create_job_role(role_def, done) {
  if(role_def.id) {
    done(null, role_def.id);
  } else {
    const insert_query = "INSERT INTO job_role (job_role_name, job_role_descr) VALUES ($1, $2)";
    const values = [role_def.name, role_def.type];

    db.queryWithArgMapFromPool(insert_query, values, (error, results) => {
      let role_id;
      if(error) {
        util.errorLog("_create_job_role SQL error: " + error);
      } else {
        role_id = results.insertId;
      }
      done(error, role_id);
    });
  }
}
function _create_job_type(type_def, done) {
  if(type_def.id) {
    done(null, type_def.id);
  } else {
    const insert_query = "INSERT INTO job_type (job_type_name, job_type_descr) VALUES ($1, $2)";
    const values = [type_def.name, type_def.type];

    db.queryWithArgMapFromPool(insert_query, values, (error, results) => {
      let type_id;
      if(error) {
        util.errorLog("_create_job_type SQL error: " + error);
      } else {
        type_id = results.insertId;
      }
      done(error, type_id);
    });
  }
}
function _create_industry(industry_def, done) {
  if(industry_def.id) {
    done(null, industry_def.id);
  } else {
    console.log('Creating an industry');

    const insert_query = "INSERT INTO industry (industry_name, industry_type) VALUES ($1, $2)";
    const values = [industry_def.name, industry_def.type];

    db.queryWithArgMapFromPool(insert_query, values, (error, results) => {
      console.log('Done with create query', error, results);

      let industry_id;
      if(error) {
        util.errorLog("_create_company SQL error: " + error);
      } else {
        industry_id = results.insertId;
      }
      done(error, industry_id);
    });
  }
}

function get_jobs(req, res) {
  res.sendStatus(202);
}
function create_job(req, res) {
  console.log(req.body);

  const company_def = req.body.company;
  const job_role = req.body.job_role;
  const job_type = req.body.job_type;
  const job_values = _extract_job_def(req);

  let company_id;
  let job_role_id;
  let job_type_id;

  async.series([
    (done) => {
      _create_company(company_def, (error, result) => {
        if(error) {
          util.errorLog(error);
        } else {
          company_id = result;
        }
        done(error);
      });
    },
    (done) => {
      _create_job_role(job_role, (error, result) => {
        if(error) {
          util.errorLog(error);
        } else {
          job_role_id = result;
        }
        done(error);
      });
    },
    (done) => {
      _create_job_type(job_type, (error, result) => {
        if(error) {
          util.errorLog(error);
        } else {
          job_type_id = result;
        }
        done(error);
      });
    },
    (done) => {
      const args = [];
      const values = [];
      Object.keys(company_def).forEach((column_name, count) => {
        const sql_index = '$' + (count + 1);
        args.push(column_name + "=" + sql_index);
        values.push(company_def[column_name]);
      });

      args.push("company_id="  + '$' + args.length);
      args.push("job_role_id=" + '$' + args.length);
      args.push("job_type_id=" + '$' + args.length);
      values.push(company_id, job_role_id, job_type_id);

      const create_sql = "INSERT INTO job SET " + args.join();
      db.queryWithArgMapFromPool(create_sql, values, (error, results) => {
        if(error) {
          util.errorLog("create_job SQL error: " + error);
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      });
    }
  ]);
}
function update_job(req, res) {
  const company_def = req.body.company;
  const job_role = req.body.job_role;
  const job_type = req.body.job_type;
  const job_values = _extract_job_def(req);

  if(!company_def.id || !job_role.id || !job_type.id) {
    res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
  } else {

    const args = [];
    const values = [];
    Object.keys(company_def).forEach((column_name, count) => {
      const sql_index = '$' + (count + 1);
      args.push(column_name + "=" + sql_index);
      values.push(company_def[column_name]);
    });

    const update_query = "UPDATE job SET " + args.join();
    db.queryWithArgMapFromPool(update_query, values, (error, results) => {
      if(error) {
        util.errorLog("update_job SQL error: " + error);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
  }
}
function delete_job(req, res) {
  const values = [req.params.job_id];
  const delete_query = "DELETE FROM job WHERE job_id = $1::int";
  db.queryWithArgMapFromPool(delete_query, values, (error, results) => {
    if(error) {
      util.errorLog("delete_job SQL error: " + error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
function get_job(req, res) {
  res.sendStatus(202);
}
