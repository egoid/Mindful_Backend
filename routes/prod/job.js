'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');
const company_util = require('../company.js');

const router = new express.Router();
exports.router = router;

const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

router.get('/1/jobs', search_job);
router.post('/1/jobs', search_job);
router.get('/1/job/:job_id', get_job);
router.get('/1/job_schedule/:job_sched_id', get_job_sched);
router.get('/1/job_skill/:job_skill_id', get_job_skill)

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
const LABEL_TO_RADIUS = {
  walk: 1.25,
  bike: 4,
  metro: 8,
  car: 8
};
const SCHEDULE_VALUES = ['all','none','morning','afternoon','evening','night'];

function _create_job_role(role_def, conn, all_done) {
  if(role_def.id) {
    all_done(null, role_def.id);
  } else {
    let role_id
    async.series([
      (done) => {
        const sql = "SELECT job_role_id FROM job_role WHERE job_role_descr = ?";
        const values = [role_def.type];
        db.queryWithConnection(conn, sql , values, (error, results) => {
          if(error) {
            console.error("_create_job_role: sql err:", error);
          } else if(results.length > 0) {
            role_id = results[0].job_role_id;
          }
          done(error);
        });
      },
      (done) => {
        if(!role_id) {
          const sql = "INSERT IGNORE INTO job_role (job_role_name, job_role_descr) VALUES (?, ?)";
          const values = [role_def.name, role_def.type];
          db.queryWithConnection(conn, sql, values, (error, results) => {
            if(error) {
              console.error("_create_job_role: sql err:", error);
            } else {
              role_id = results.insertId;
            }
            done(error);
          });
        } else {
          done();
        }
      }
    ],
    (error) => {
      all_done(error, role_id);
    });
  }
}
function _create_job_type(type_def, conn, all_done) {
  if(type_def.id) {
    all_done(null, type_def.id);
  } else {
    let type_id;
    async.series([
      (done) => {
        const sql = "SELECT job_type_id FROM job_type WHERE job_type_descr = ?";
        const values = [type_def.type];
        db.queryWithConnection(conn, sql , values, (error, results) => {
          if(error) {
            console.error("_create_job_type: sql err:", error);
          } else if(results.length > 0) {
            type_id = results[0].job_type_id;
          }
          done(error);
        });
      },
      (done) => {
        if(!type_id) {
          const sql = "INSERT IGNORE INTO job_type (job_type_name, job_type_descr) VALUES (?, ?)";
          const values = [type_def.name, type_def.type];
          db.queryWithConnection(conn, sql, values, (error, results) => {
            if(error) {
              console.error("_create_job_type: sql err:", error);
            } else {
              type_id = results.insertId;
            }
            done(error);
          });
        } else {
          done();
        }
      },
    ],
    (error) => {
      all_done(error, type_id);
    });
  }
}
function _extract_job_def(req) {
  return {
    title: req.body.title,
    employer_id: req.body.employer_id,
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
function _make_job_from_results(results) {
  let result = {};

  if(results.length) {
    let job = _.pick(results[0], JOB_KEYS);
    let job_role = _.pick(results[0], JOB_ROLE_KEYS);
    let job_type = _.pick(results[0], JOB_TYPE_KEYS);
    let company = _.pick(results[0], COMPANY_KEYS);

    let skills = [];
    _.each(results, (r) => {
      skills.push(_.pick(r, SKILL_KEYS));
    });

    company.property_bag = JSON.parse(company.property_bag);

    result = {
      job: Object.assign({}, job, job_role, job_type, company),
      skills,
    };
  }

  return result;
}
function _radius_lat_long_calc(lat, lon, radius) {
  const R  = 3959;
  const x1 = lon - _to_degrees(radius/R/Math.cos(_to_radians(lat)));
  const x2 = lon + _to_degrees(radius/R/Math.cos(_to_radians(lat)));
  const y1 = lat + _to_degrees(radius/R);
  const y2 = lat - _to_degrees(radius/R);

  return [x1, y1, x2, y2];
}
function _to_degrees(radians) {
  return radians * 180 / Math.PI;
}
function _to_radians(degrees) {
  return degrees * Math.PI / 180;
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
        console.error("get_job: sql err:", error);
        res.sendStatus(500);
      } else if(results.length < 1) {
        res.sendStatus(404);
      } else {
        let result = _make_job_from_results(results);
        res.status(200).send(result);
      }
    });
}
function search_job(req, res) {
  const search_location = req.body.location || req.query.location;
  const search_string = req.body.search || req.query.search;
  const search_industry = req.body.industry_id || req.query.industry_id;

  let search_radius_label = req.body.radius || req.query.radius;

  let search_lat;
  let search_long;
  let search_formatted;

  if(Object.keys(LABEL_TO_RADIUS).indexOf(search_radius_label) < 0) {
    search_radius_label = 'bike';
  }

  async.series([
    (done) => {
      geocoder.geocode(search_location)
        .then((res) => {
          search_formatted = res[0].formattedAddress;
          search_lat = res[0].latitude;
          search_long = res[0].longitude;
          done();
        })
        .catch((err) => {
          console.error("search_job: geocoding err:", err);
          done(err);
        });
    },
    (done) => {
      let values = [search_lat, search_lat, search_long, search_long];
      let sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, skill_type.* " +
                  "FROM job " +
                  "JOIN company USING(company_id) " +
                  "JOIN industry USING(industry_id) " +
                  "JOIN job_role USING(job_role_id) " +
                  "JOIN job_type USING(job_type_id) " +
                  "LEFT JOIN job_skill USING(job_id) " +
                  "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id " +
                  "WHERE " +
                  "latitude_lower_"  + search_radius_label + " <= ? AND " +
                  "latitude_upper_"  + search_radius_label + " >= ? AND " +
                  "longitude_lower_" + search_radius_label + " >= ? AND " +
                  "longitude_upper_" + search_radius_label + " <= ?";

      if(search_industry >= 1) {
        sql += " AND industry.industry_id = ?";
        values.push(search_industry);
      }
      if(search_string) {
        sql += " AND job.title LIKE ?";
        values.push(search_string);
      }

      db.connectAndQuery({sql, values}, (error, results) => {
        let result;
        if(error) {
          console.error("search_job: sql err:", error);
        } else {
          result = _make_job_from_results(results);
        }
        done(error, result);
      });
    },
  ],
  (error, result) => {
    if(error) {
      res.sendStatus(500);
    } else {
      res.status(200).send(result);
    }
  });
}
function get_job_sched(req, res) {
  const sql = "SELECT * FROM job_schedule WHERE job_schedule_id = ?";
  const values = [req.params.job_schedule_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_job_sched: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function get_job_skill(req, res) {
  const sql = "SELECT * FROM job_skill WHERE job_skill_id = ?";
  const values = [req.params.job_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_job_skill: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
