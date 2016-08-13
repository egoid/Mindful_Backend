'use strict';

const _ = require('lodash');
const async = require('async');
const config = require('node-config-sets');
const ejs = require('ejs');
const express = require('express');
const NodeGeocoder = require('node-geocoder');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

const SINGLE_JOB_URL = '/1/job/:job_id';
const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

router.get('/1/jobs', get_jobs);
router.post('/1/job', create_job);
router.put(SINGLE_JOB_URL, update_job);
router.delete(SINGLE_JOB_URL, delete_job);
router.get(SINGLE_JOB_URL, get_job);

const JOB_KEYS = [
  'job_id',
  'company_id',
  'employer_id',
  'title',
  'pay_rate_min',
  'pay_rate_max',
  'job_schedule_id',
  'min_gpa',
  'school_level_id',
  'description',
  'responsibilities',
  'activities',
  'is_yobs_client',
  'external_url',
  'posted_at',
  'takedown_at',
  'created_at',
  'created_by',
  'modified_at',
  'modified_by',
  'is_deleted',
  'deleted_at',
  'deleted_by',
  'location'
];
const COMPANY_KEYS = [
  'company_id',
  'name',
  'industry_id',
  'email_domain',
  'property_bag',
  'created_at',
  'created_by',
  'modified_at',
  'modified_by',
  'is_deleted',
  'deleted_at',
  'deleted_by',
];
const JOB_ROLE_KEYS = [
  'job_role_id',
  'job_role_name',
  'job_role_descr'
];
const JOB_TYPE_KEYS = [
  'job_type_id',
  'job_type_name',
  'job_type_descr'
];
const SKILL_KEYS = [
  'job_skill_id',
  'skill_type_id',
  'skill_type_name',
  'skill_type_desc'
];

function _extract_job_def(req) {
  return {
    title: req.body.title,
    location: req.body.location || null,
    pay_rate_min: req.body.pay_rate_min || null,
    pay_rate_max: req.body.pay_rate_max || null,
    min_gpa: req.body.min_gpa || null,
    description: req.body.description || null,
    external_url: req.body.external_url || null,
    posted_at: req.body.posted_at || null,
    takedown_at: req.body.takedown_at || null
  };
}
function _create_company(company_def, conn, all_done) {
  let industry_id;
  let company_id;

  if(company_def.id) {
    all_done(null, company_def.id);
  } else {
    async.series([
      (done) => {
        _create_industry(company_def.industry, conn, (error, result) => {
          if(error) {
            console.error(error);
          } else {
            industry_id = result;
          }
          done(error);
        });
      },
      (done) => {
        const sql = "INSERT IGNORE INTO company (name, industry_id, email_domain, property_bag) VALUES (?, ?, ?, ?)";
        const values = [company_def.name, industry_id, company_def.email_domain, JSON.stringify(company_def.property_bag)];
        db.queryWithConnection(conn, sql , values, (error, results) => {
          if(error) {
            console.error("_create_company SQL error: " + error);
          } else {
            company_id = results.insertId;
          }
          done(error, company_id);
        });
      }
    ],
    (error) => {
      all_done(error, company_id);
    });
  }
}
function _create_job_role(role_def, conn, done) {
  if(role_def.id) {
    done(null, role_def.id);
  } else {
    const sql = "INSERT IGNORE INTO job_role (job_role_name, job_role_descr) VALUES (?, ?)";
    const values = [role_def.name, role_def.type];
    db.queryWithConnection(conn, sql, values, (error, results) => {
      let role_id;
      if(error) {
        console.error("_create_job_role SQL error: " + error);
      } else {
        role_id = results.insertId;
      }
      done(error, role_id);
    });
  }
}
function _create_job_type(type_def, conn, done) {
  if(type_def.id) {
    done(null, type_def.id);
  } else {
    const sql = "INSERT IGNORE INTO job_type (job_type_name, job_type_descr) VALUES (?, ?)";
    const values = [type_def.name, type_def.type];
    db.queryWithConnection(conn, sql, values, (error, results) => {
      let type_id;
      if(error) {
        console.error("_create_job_type SQL error: " + error);
      } else {
        type_id = results.insertId;
      }
      done(error, type_id);
    });
  }
}
function _create_industry(industry_def, conn, done) {
  if(industry_def.id) {
    done(null, industry_def.id);
  } else {
    const sql = "INSERT IGNORE INTO industry (industry_name, industry_type) VALUES (?, ?)";
    const values = [industry_def.name, industry_def.type];
    db.queryWithConnection(conn, sql, values, (error, results) => {
      let industry_id;
      if(error) {
        console.error("_create_company SQL error: " + error);
      } else {
        industry_id = results.insertId;
      }
      done(error, industry_id);
    });
  }
}
function _make_job_from_results(results) {
  let job = _.pick(results[0], JOB_KEYS);
  let job_role = _.pick(results[0], JOB_ROLE_KEYS);
  let job_type = _.pick(results[0], JOB_TYPE_KEYS);
  let company = _.pick(results[0], COMPANY_KEYS);

  let skills = [];
  _.each(results, (r) => {
    skills.push(_.pick(r, SKILL_KEYS));
  });

  company.property_bag = JSON.parse(company.property_bag);

  return {
    job: Object.assign({}, job, job_role, job_type, company),
    skills,
  };
}

function get_jobs(req, res) {
  res.sendStatus(202);
}
function create_job(req, res) {
  const company_def = req.body.company;
  const job_role = req.body.job_role;
  const job_type = req.body.job_type;
  const job_values = _extract_job_def(req);

  let company_id;
  let job_role_id;
  let job_type_id;
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
      db.queryWithConnection(connection, "START TRANSACTION", [], (error) => {
        if(error) {
          console.error(error);
        }
        done(error);
      });
    },
    (done) => {
      _create_company(company_def, connection, (error, result) => {
        if(error) {
          console.error(error);
        } else {
          company_id = result;
          console.log('Company ID', company_id);
        }
        done(error);
      });
    },
    (done) => {
      _create_job_role(job_role, connection, (error, result) => {
        if(error) {
          console.error(error);
        } else {
          job_role_id = result;
          console.log('Job Role ID', company_id);
        }
        done(error);
      });
    },
    (done) => {
      _create_job_type(job_type, connection, (error, result) => {
        if(error) {
          console.error(error);
        } else {
          job_type_id = result;
          console.log('Job Type ID', company_id);
        }
        done(error);
      });
    },
    (done) => {
      const columns = [];
      const values = [];

      _.each(Object.keys(job_values), (column_name, count) => {
        columns.push(column_name);
        values.push(job_values[column_name]);
      });

      columns.push('company_id', 'job_role_id', 'job_type_id');
      values.push(company_id, job_role_id, job_type_id);

      const sql = "INSERT INTO job (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0,-1) + ")";
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("create_job SQL error: " + error);
        }
        done(error);
      });
    },
    (done) => {
      db.commit(connection, done);
    },
  ],
  (error) => {
    if(error) {
      db.rollback(connection, () => {});
      console.error("create_job error: " + error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
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
    _.each(Object.keys(job_values), (column) => {
      args.push(column + "=?");
      values.push(job_values[column]);
    });

    const sql = "UPDATE job SET " + args.join(",");
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        console.error("update_job SQL error: " + error);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
  }
}
function delete_job(req, res) {
  const values = [req.params.job_id];
  const sql = "DELETE FROM job WHERE job_id = $1::int";
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_job SQL error: " + error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
function get_job(req, res) {
  const sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, skill_type.* " +
              "FROM job " +
              "JOIN company USING(company_id) " +
              "JOIN industry USING(industry_id) " +
              "JOIN job_role USING(job_role_id) " +
              "JOIN job_type USING(job_type_id) " +
              "LEFT JOIN job_skill USING(job_id) " +
              "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id " +
              "WHERE job_id = ?";
    db.connectAndQuery({sql, values: [req.params.job_id]}, (error, results) => {
      if(error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        let result = _make_job_from_results(results);
        res.status(200).send(result);
      }
    });
}
