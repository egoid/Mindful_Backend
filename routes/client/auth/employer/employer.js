'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');
const async = require('async');
const NodeGeocoder = require('node-geocoder');
const _ = require('lodash');
const router = new express.Router();
exports.router = router;

router.get('/1/employer', get_employer);
router.get('/1/employer_exists', search_employer)
router.get('/1/employer/job', get_employer_jobs_by_employer);

//** imported from employer/jobs
router.get('/1/employer/job/more_jobs_by', get_more_jobs);

const GOOGLE_GEO_CONFIG = {
    apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
    formatter: null,
    httpAdapter: 'https',
    provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

function get_employer(req, res) {
  const sql = "SELECT employer.*, user.email AS employee_name " +
              "FROM employer " +
              "JOIN user USING(user_id) " +
              "WHERE employer_id = ?";
  const values = [1];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employer: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
};
function search_employer(req, res) {
  const sql = "SELECT employer.*, user.email AS employee_name " +
              "FROM employer " +
              "JOIN user USING(user_id) " +
              "WHERE employer_id = ?";
  const values = [1];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employer: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function get_employer_jobs_by_employer(req, res) {
  const sql = "SELECT job.* FROM job WHERE employer_id = ?";
  const values = [req.user.employer_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employer_jobs_by_employer: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results);
    }
  });
};

//*******
//*******
//**
//**
//** imported from employee/job
//**
//**

function get_more_jobs(req,res) {
  const search_location = req.body.location || req.query.location;
  const search_string = req.body.search || req.query.search;
  const search_industry = req.body.industry_id || req.query.industry_id;
  const search_job_type = req.body.job_type_id || req.query.job_type_id;
  let search_radius_label = req.body.radius || req.query.radius;

  let search_lat;
  let search_long;
  let search_formatted;
  let result;

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
                  "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " +
                  "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id "

      if(search_industry && (search_industry.length || search_industry >= 1)) {
        sql += " AND company.industry_id IN (?) ";
        values.push(search_industry);
      }
      if(search_string) {
        sql += " AND job.title LIKE ? ";
        values.push('%' + search_string + '%');
      }
      if(search_job_type && (search_job_type.length || search_job_type >= 1)) {
        sql += " AND job.job_type_id IN (?) ";
        values.push(search_job_type);
      }
      if (req.query.company_id) {
        sql += "WHERE company.company_id = '" + String(req.query.company_id) + "' "
      }
      if (req.query.page_number > 1) {
        sql += " LIMIT " + String(req.query.page_number*25) + " OFFSET "  + String((req.query.page_number-1)*25)
      } 
      if(req.query.page_number) {
        sql += " LIMIT " + String(req.query.page_number*25) 
      }

      db.connectAndQuery({sql, values, nestTables: true}, (error, results) => {
        console.log(results)
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
  'longitude',
  'industry_id',
  'hours',
];
const COMPANY_KEYS = [
  'company_id',
  'name',
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
