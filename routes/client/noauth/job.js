'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');
const db = require('../../../mysql_db_prod.js');

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
router.get('/1/job/:job_id', get_job);
router.get('/1/job_roles', get_job_roles);

router.post('/1/jobs', search_job);

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
  'is_deleted',
  'location',
  'latitude',
  'longitude'
];
const COMPANY_KEYS = [
  'company_id',
  'name',
  'industry_id',
  'email_domain',
  'property_bag',
  'is_deleted',
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

function _make_job_from_results(results) {
  let result = [];
  let job_ids = {}

  if(results.length) {
    _.each(results, (a_result) => {
      if(!job_ids[a_result.job.job_id]) {
        job_ids[a_result.job.job_id] = true;

        let job      = _.pick(a_result.job, JOB_KEYS);
        let job_role = _.pick(a_result.job_role, JOB_ROLE_KEYS);
        let job_type = _.pick(a_result.job_type, JOB_TYPE_KEYS);
        let company  = _.pick(a_result.company, COMPANY_KEYS);
        let skills   = [];

        company.property_bag = JSON.parse(company.property_bag);

        _.each(results, (r) => {
          if(r.job.job_id == r.job_skill.job_id) {
            const skill_def = _.pick(r.skill_type, SKILL_KEYS);
            skill_def.push(r.job_skill.job_skill_id)
            skills.push(skill_def);
          }
        });

        result.push({
          job: Object.assign({}, job, job_role, job_type),
          industry: a_result.industry,
          job_schedule: a_result.job_schedule,
          company,
          skills,
        });
      }
    });
  }

  return result;
}

function get_job(req, res) {
  const sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, job_schedule.*, skill_type.* " +
              "FROM job " +
              "JOIN company USING(company_id) " +
              "JOIN industry USING(industry_id) " +
              "JOIN job_role USING(job_role_id) " +
              "JOIN job_type USING(job_type_id) " +
              "LEFT JOIN job_schedule USING(job_schedule_id) " +
              "LEFT JOIN job_skill USING(job_id) " +
              "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id " +
              "WHERE job_id = ?";
    db.connectAndQuery({sql, values: [req.params.job_id], nestTables: true}, (error, results) => {
      if(error) {
        console.error("get_job: sql err:", error);
        res.sendStatus(500);
      } else if(results.length < 1) {
        res.sendStatus(404);
      } else {
        let result = _make_job_from_results(results);
        res.status(200).send(result[0]);
      }
    });
}
function search_job(req, res) {
  const search_location = req.body.location || req.query.location;
  const search_string = req.body.search || req.query.search;
  const search_industry = req.body.industry_id || req.query.industry_id;
  const search_job_type = req.body.job_type_id || req.query.job_type_id;
  let search_radius_label = req.body.radius || req.query.radius;

  let search_lat;
  let search_long;
  let search_formatted;
  let result;

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
      let sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, job_schedule.*, skill_type.* " +
                  "FROM job " +
                  "JOIN company USING(company_id) " +
                  "JOIN industry USING(industry_id) " +
                  "JOIN job_role USING(job_role_id) " +
                  "JOIN job_type USING(job_type_id) " +
                  "LEFT JOIN job_schedule USING(job_schedule_id) " +
                  "LEFT JOIN job_skill USING(job_id) " +
                  "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id " +
                  "WHERE " +
                  "(job.is_deleted = 0 OR job.is_deleted IS NULL) AND " +
                  "job.latitude_lower_"  + search_radius_label + " <= ? AND " +
                  "job.latitude_upper_"  + search_radius_label + " >= ? AND " +
                  "job.longitude_lower_" + search_radius_label + " >= ? AND " +
                  "job.longitude_upper_" + search_radius_label + " <= ?";

      if(search_industry && (search_industry.length || search_industry >= 1)) {
        sql += " AND company.industry_id IN (?)";
        values.push(search_industry);
      }
      if(search_string) {
        sql += " AND job.title LIKE ?";
        values.push('%' + search_string + '%');
      }
      if(search_job_type && (search_job_type.length || search_job_type >= 1)) {
        sql += " AND job.job_type_id IN (?)";
        values.push(search_job_type);
      }

      db.connectAndQuery({sql, values, nestTables: true}, (error, results) => {
        if(error) {
          console.error("search_job: sql err:", error);
        } else {
          result = _make_job_from_results(results);
        }
        done(error);
      });
    },
  ],
  (error) => {
    if(error) {
      res.sendStatus(500);
    } else {
      res.status(200).send(result);
    }
  });
}
function get_job_roles(req, res) {
  const sql = "SELECT * FROM job_role";
  const values = [];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_job_roles: sql err:", error);
      res.sendStatus(500);
    } else {
      const job_roles = [];
      _.each(results, (result) => {
        job_roles.push(_.pick(result, JOB_ROLE_KEYS));
      });
      res.status(200).send(job_roles);
    }
  });
}
