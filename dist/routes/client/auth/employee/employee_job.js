'use strict';

var express = require('express');
var db = require('../../../../mysql_db_prod.js');
var _ = require('lodash');
var async = require('async');
var NodeGeocoder = require('node-geocoder');

var router = new express.Router();
exports.router = router;

var GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google'
};
var geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);
var EMPLOYEE_JOB_STATUS = ['saved', 'submitted', 'reviewed', 'interview', 'offer', 'pass'];

router.get('/1/employee/job', search_job);
router.get('/1/employee/job/search', query_job);
router.get('/1/employee/job/more_jobs_by', get_more_jobs);
router.get('/1/employee/job/job_list', get_joblist_length);
router.post('/1/employee/job', create_employee_job);

router.delete('/1/employee/job/:employee_job_id', delete_employee_job);

function get_more_jobs(req, res) {
  var search_location = req.body.location || req.query.location;
  var search_string = req.body.search || req.query.search;
  var search_industry = req.body.industry_id || req.query.industry_id;
  var search_job_type = req.body.job_type_id || req.query.job_type_id;
  var search_radius_label = req.body.radius || req.query.radius;

  var search_lat = void 0;
  var search_long = void 0;
  var search_formatted = void 0;
  var result = void 0;

  if (Object.keys(LABEL_TO_RADIUS).indexOf(search_radius_label) < 0) {
    search_radius_label = 'bike';
  }

  async.series([function (done) {
    geocoder.geocode(search_location).then(function (res) {
      search_formatted = res[0].formattedAddress;
      search_lat = res[0].latitude;
      search_long = res[0].longitude;
      done();
    }).catch(function (err) {
      console.error("search_job: geocoding err:", err);
      done(err);
    });
  }, function (done) {
    var values = [search_lat, search_lat, search_long, search_long];
    var sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, job_schedule.*, skill_type.* " + "FROM job " + "JOIN company USING(company_id) " + "JOIN industry USING(industry_id) " + "JOIN job_role USING(job_role_id) " + "JOIN job_type USING(job_type_id) " + "LEFT JOIN job_schedule USING(job_schedule_id) " + "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " + "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id ";

    if (search_industry && (search_industry.length || search_industry >= 1)) {
      sql += " AND company.industry_id IN (?) ";
      values.push(search_industry);
    }
    if (search_string) {
      sql += " AND job.title LIKE ? ";
      values.push('%' + search_string + '%');
    }
    if (search_job_type && (search_job_type.length || search_job_type >= 1)) {
      sql += " AND job.job_type_id IN (?) ";
      values.push(search_job_type);
    }
    if (req.query.company_id) {
      sql += "WHERE company.company_id = '" + String(req.query.company_id) + "' ";
    }
    if (req.query.page_number > 1) {
      sql += " LIMIT " + String(req.query.page_number * 25) + " OFFSET " + String((req.query.page_number - 1) * 25);
    }
    if (req.query.page_number) {
      sql += " LIMIT " + String(req.query.page_number * 25);
    }

    db.connectAndQuery({ sql: sql, values: values, nestTables: true }, function (error, results) {
      console.log(results);
      if (error) {
        console.error("search_job: sql err:", error);
      } else {
        result = _make_job_from_results(results);
      }
      done(error);
    });
  }], function (error) {
    if (error) {
      res.sendStatus(500);
    } else {
      res.status(200).send(result);
    }
  });
}

function query_job(req, res) {
  var search_location = req.body.location || req.query.location;
  var search_string = req.body.search || req.query.search;
  var search_industry = req.body.industry_id || req.query.industry_id;
  var search_job_type = req.body.job_type_id || req.query.job_type_id;
  var search_radius_label = req.body.radius || req.query.radius;

  var search_lat = void 0;
  var search_long = void 0;
  var search_formatted = void 0;
  var result = void 0;

  if (Object.keys(LABEL_TO_RADIUS).indexOf(search_radius_label) < 0) {
    search_radius_label = 'bike';
  }

  async.series([function (done) {
    geocoder.geocode(search_location).then(function (res) {
      search_formatted = res[0].formattedAddress;
      search_lat = res[0].latitude;
      search_long = res[0].longitude;
      done();
    }).catch(function (err) {
      console.error("search_job: geocoding err:", err);
      done(err);
    });
  }, function (done) {
    var values = [search_lat, search_lat, search_long, search_long];
    var sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, job_schedule.*, skill_type.* " + "FROM job " + "JOIN company USING(company_id) " + "JOIN industry USING(industry_id) " + "JOIN job_role USING(job_role_id) " + "JOIN job_type USING(job_type_id) " + "LEFT JOIN job_schedule USING(job_schedule_id) " + "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " + "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id ";

    if (search_industry && (search_industry.length || search_industry >= 1)) {
      sql += " AND company.industry_id IN (?) ";
      values.push(search_industry);
    }
    if (search_string) {
      sql += " AND job.title LIKE ? ";
      values.push('%' + search_string + '%');
    }
    if (search_job_type && (search_job_type.length || search_job_type >= 1)) {
      sql += " AND job.job_type_id IN (?) ";
      values.push(search_job_type);
    }
    if (req.query.query) {
      sql += "WHERE ( UPPER(job.title) LIKE UPPER('" + String(req.query.query) + "') || " + "UPPER(company.name) LIKE UPPER('" + String(req.query.query) + "') || " + "UPPER(job_role.job_role_name) LIKE UPPER('" + String(req.query.query) + "') )";
    }
    if (req.query.industry) {
      sql += "WHERE ( job.industry_id LIKE '" + String(req.query.industry) + "')";
    }
    if (req.query.page_number > 1) {
      sql += " LIMIT " + String(req.query.page_number * 25) + " OFFSET " + String((req.query.page_number - 1) * 25);
    }
    if (req.query.page_number) {
      sql += " LIMIT " + String(req.query.page_number * 25);
    }

    db.connectAndQuery({ sql: sql, values: values, nestTables: true }, function (error, results) {
      console.log(results);
      if (error) {
        console.error("search_job: sql err:", error);
      } else {
        result = _make_job_from_results(results);
      }
      done(error);
    });
  }], function (error) {
    if (error) {
      res.sendStatus(500);
    } else {
      res.status(200).send(result);
    }
  });
}

function get_joblist_length(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT count(*) FROM job ";
  if (req.query.query) {
    sql += "WHERE ( UPPER(job.title) LIKE UPPER('" + String(req.query.query) + "') || " + "UPPER(company.name) LIKE UPPER('" + String(req.query.query) + "') || " + "UPPER(job_role.job_role_name) LIKE UPPER('" + String(req.query.query) + "') )";
  };
  if (req.query.industry) {
    sql += "WHERE ( job.industry_id LIKE '" + String(req.query.industry) + "')";
  };
  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}

function search_job(req, res) {
  var search_location = req.body.location || req.query.location;
  var search_string = req.body.search || req.query.search;
  var search_industry = req.body.industry_id || req.query.industry_id;
  var search_job_type = req.body.job_type_id || req.query.job_type_id;
  var search_radius_label = req.body.radius || req.query.radius;

  var search_lat = void 0;
  var search_long = void 0;
  var search_formatted = void 0;
  var result = void 0;

  if (Object.keys(LABEL_TO_RADIUS).indexOf(search_radius_label) < 0) {
    search_radius_label = 'bike';
  }

  async.series([function (done) {
    geocoder.geocode(search_location).then(function (res) {
      search_formatted = res[0].formattedAddress;
      search_lat = res[0].latitude;
      search_long = res[0].longitude;
      done();
    }).catch(function (err) {
      console.error("search_job: geocoding err:", err);
      done(err);
    });
  }, function (done) {
    var values = [search_lat, search_lat, search_long, search_long];
    var sql = "SELECT job.*, company.* , job_role.*, job_type.*, job_skill.*, job_schedule.*, skill_type.* " + "FROM job " + "JOIN company USING(company_id) " + "JOIN job_role USING(job_role_id) " + "JOIN job_type USING(job_type_id) " + "LEFT JOIN job_schedule USING(job_schedule_id) " + "LEFT JOIN job_skill ON job_skill.job_id = job.job_id " + "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id ";

    // if(search_industry && (search_industry.length || search_industry >= 1)) {
    //   sql += " AND company.industry_id IN (?) ";
    //   values.push(search_industry);
    // }
    if (search_string) {
      sql += " AND job.title LIKE ? ";
      values.push('%' + search_string + '%');
    }
    if (search_job_type && (search_job_type.length || search_job_type >= 1)) {
      sql += " AND job.job_type_id IN (?) ";
      values.push(search_job_type);
    }

    sql += " LIMIT " + String(req.query.page_number * 25) + " OFFSET " + String((req.query.page_number - 1) * 25);

    db.connectAndQuery({ sql: sql, values: values, nestTables: true }, function (error, results) {
      if (error) {
        console.error("search_job: sql err:", error);
      } else {
        result = _make_job_from_results(results);
      }
      done(error);
    });
  }], function (error) {
    if (error) {
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
  var employee_id = req.user.employee_id;
  var job_id = req.body.job_id;
  var interview_date = req.body.interview_date;
  var status = req.body.status;

  if (EMPLOYEE_JOB_STATUS.indexOf(status) < 0) {
    status = NULL;
  }

  var sql = "INSERT INTO employee_job SET ?";
  var values = { employee_id: employee_id, job_id: job_id, status: status, interview_date: interview_date };

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error("create_employee_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send({ id: results.insertId });
    }
  });
}
function update_employee_job(req, res) {
  var employee_job_id = req.params.employee_job_id;
  var interview_date = req.body.interview_date || NULL;
  var job_status = req.body.status;

  if (EMPLOYEE_JOB_STATUS.indexOf(job_status) < 0) {
    job_status = NULL;
  }

  var sql = "UPDATE employee_job SET status = ?, interview_date = ? WHERE employee_job_id = ? AND employee_id = ?";
  var values = [job_status, interview_date, employee_job_id, req.user.employee_id];
  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error("update_employee_job: sql err:", error);
      res.sendStatus(500);
    } else if (results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_employee_job(req, res) {
  var sql = "DELETE FROM employee_job WHERE employee_job_id = ? AND employee_id = ?";
  var values = [req.params.employee_job_id, req.user.employee_id];
  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error("delete_employee_job: sql err:", error);
      res.sendStatus(500);
    } else if (results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}

//**
//Imported from client/noauth/job.js

var JOB_KEYS = ['job_id', 'company_id', 'employer_id', 'title', 'pay_rate_min', 'pay_rate_max', 'job_schedule_id', 'min_gpa', 'school_level_id', 'description', 'responsibilities', 'activities', 'is_yobs_client', 'external_url', 'posted_at', 'takedown_at', 'is_deleted', 'location', 'latitude', 'longitude', 'industry_id'];
var COMPANY_KEYS = ['company_id', 'name', 'email_domain', 'property_bag', 'is_deleted'];
var JOB_ROLE_KEYS = ['job_role_id', 'job_role_name', 'job_role_descr'];
var JOB_TYPE_KEYS = ['job_type_id', 'job_type_name', 'job_type_descr'];
var SKILL_KEYS = ['skill_type_id', 'skill_type_name', 'skill_type_desc'];
var LABEL_TO_RADIUS = {
  walk: 1.25,
  bike: 4,
  metro: 8,
  car: 8
};

function _make_job_from_results(results) {
  var result = [];
  var job_ids = {};

  if (results.length) {
    _.each(results, function (a_result) {
      if (!job_ids[a_result.job.job_id]) {
        (function () {
          job_ids[a_result.job.job_id] = true;

          var job = _.pick(a_result.job, JOB_KEYS);
          var job_role = _.pick(a_result.job_role, JOB_ROLE_KEYS);
          var job_type = _.pick(a_result.job_type, JOB_TYPE_KEYS);
          var company = _.pick(a_result.company, COMPANY_KEYS);
          var skills = [];

          company.property_bag = JSON.parse(company.property_bag);

          _.each(results, function (r) {
            if (r.job.job_id == r.job_skill.job_id) {
              var skill_def = _.pick(r.skill_type, SKILL_KEYS);
              skill_def.push(r.job_skill.job_skill_id);
              skills.push(skill_def);
            }
          });

          result.push({
            job: Object.assign({}, job, job_role, job_type),
            industry: a_result.industry,
            job_schedule: a_result.job_schedule,
            company: company,
            skills: skills
          });
        })();
      }
    });
  }

  return result;
}
//# sourceMappingURL=employee_job.js.map