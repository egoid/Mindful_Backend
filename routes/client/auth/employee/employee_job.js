'use strict';

const express = require('express');
const db = require('../../../../mysql_db_prod.js');
const _ = require('lodash');
const async = require('async');
var distance = require('google-distance');
const NodeGeocoder = require('node-geocoder');

const router = new express.Router();
exports.router = router;


const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);
const EMPLOYEE_JOB_STATUS = ['saved','submitted','reviewed','interview','offer','pass'];

router.get('/1/employee/job', search_job);
router.get('/1/employee/job/search', query_job);
router.get('/1/employee/job/more_jobs_by', get_more_jobs);
router.get('/1/employee/job/job_list', get_joblist_length );
router.get('/1/employee/applied_to/', get_job_applications );
router.post('/1/employee/job', create_employee_job);

router.delete('/1/employee/job/:employee_job_id', delete_employee_job);

function get_job_applications(req, res) {
    
    const sql = "SELECT distinct applied_job_id, status " +
  "FROM job_applications " +
  "WHERE employee_id  = ?";
    const values = [req.query.employee_id];

    
    db.connectAndQuery({sql, values}, (err, results) => {

  if (err) {
      console.error("get_job_applications: sql err:", err);
      res.sendStatus(500);
  } else if (results.length < 1) {
      // res.sendStatus(404);
      res.status(200).send([]);
  } else {
      res.status(200).send(results);
  }
    });
    
}
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
                  "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " +
                  "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id "
                  "WHERE job.is_deleted = 0 "

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

function query_job(req,res) {
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
                  "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " +
                  "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id "

      sql += "WHERE job.is_deleted = 0 "
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
      if (req.query.query) {
        sql += "AND ( UPPER(job.title) LIKE UPPER('" + String(req.query.query) + "') || " +
                        "UPPER(company.name) LIKE UPPER('" + String(req.query.query) + "') || " +
                        "UPPER(job_role.job_role_name) LIKE UPPER('" + String(req.query.query) + "') ) "
      }
      if (req.query.industry) {
        sql += "AND ( job.industry_id LIKE '" + String(req.query.industry) + "') "
      }      
      if (req.query.page_number > 1) {
        sql += " LIMIT " + String(req.query.page_number*25) + " OFFSET "  + String((req.query.page_number-1)*25)
      } 
      if(req.query.page_number) {
        sql += " LIMIT " + String(req.query.page_number*25) 
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

function get_joblist_length(req, res) {
  const category = req.query.job_category;
  const values = [];
  let sql = "SELECT count(*) FROM job "
  sql += "WHERE job.is_deleted = 0 "
  if (req.query.query) {
    sql += "AND ( UPPER(job.title) LIKE UPPER('" + String(req.query.query) + "') || " +
                    "UPPER(company.name) LIKE UPPER('" + String(req.query.query) + "') || " +
                    "UPPER(job_role.job_role_name) LIKE UPPER('" + String(req.query.query) + "') )"
  };
  if (req.query.industry) {
    sql += "AND ( job.industry_id LIKE '" + String(req.query.industry) + "')"
  };
  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
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
      let sql = "SELECT job.*, company.* , job_role.*, job_type.*, job_skill.*, job_schedule.*, skill_type.* " +
                  "FROM job " +
                  "JOIN company USING(company_id) " +
                  "JOIN job_role USING(job_role_id) " +
                  "JOIN job_type USING(job_type_id) " +
                  "LEFT JOIN job_schedule USING(job_schedule_id) " +
                  "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " +
                  "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id " +
                  "WHERE job.is_deleted = 0 " 

      // if(search_industry && (search_industry.length || search_industry >= 1)) {
      //   sql += " AND company.industry_id IN (?) ";
      //   values.push(search_industry);
      // }
      if(search_string) {
        sql += " AND job.title LIKE ? ";
        values.push('%' + search_string + '%');
      }
      if(search_job_type && (search_job_type.length || search_job_type >= 1)) {
        sql += " AND job.job_type_id IN (?) ";
        values.push(search_job_type);
      }

      sql += " LIMIT " + String(req.query.page_number*25) + " OFFSET "  + String((req.query.page_number-1)*25)
      db.connectAndQuery({sql, values, nestTables: true}, (error, results) => {
        if(error) {
          console.error("search_job: sql err:", error);
        } else {
          result = _make_job_from_results(results, search_location);
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
// function get_employee_jobs(req, res) {
//   const sql = "select * from job"
//   // const sql = "SELECT employee_job.*, job.* FROM employee_job JOIN job USING(job_id) WHERE employee_id = ?";
//   // const values = [req.user.employee_id];
//   const values = [1];

//   db.connectAndQuery({sql, values}, (error, results) => {
//     if(error) {
//       console.error("get_employee_jobs: sql err:", error);
//       res.sendStatus(500);
//     } else if(results.length < 1) {
//       res.sendStatus(404);
//     } else {
//       res.status(200).send(results)
//     }
//   });
// }

function create_employee_job(req, res) {
  const employee_id = req.user.employee_id;
  const job_id = req.body.job_id;
  const interview_date = req.body.interview_date;
  let status = req.body.status;

  if(EMPLOYEE_JOB_STATUS.indexOf(status) < 0) {
    status = NULL;
  }

  const sql = "INSERT INTO employee_job SET ?";
  const values = { employee_id, job_id, status, interview_date };

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_employee_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send({id: results.insertId});
    }
  });
}
function update_employee_job(req, res) {
  const employee_job_id = req.params.employee_job_id;
  const interview_date = req.body.interview_date || NULL;
  let job_status = req.body.status;

  if(EMPLOYEE_JOB_STATUS.indexOf(job_status) < 0) {
    job_status = NULL;
  }

  const sql = "UPDATE employee_job SET status = ?, interview_date = ? WHERE employee_job_id = ? AND employee_id = ?";
  const values = [job_status, interview_date, employee_job_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_employee_job: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_employee_job(req, res) {
  const sql = "DELETE FROM employee_job WHERE employee_job_id = ? AND employee_id = ?";
  const values = [req.params.employee_job_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_job: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}

//**
//Imported from client/noauth/job.js

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


function _make_job_from_results(results, your_loc) {
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
          distance: distance ,
        });
      }
    });
  }

  return result;
}
