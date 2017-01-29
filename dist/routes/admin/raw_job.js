'use strict';

var _ = require('lodash');
var express = require('express');
var db = require('../../mysql_db.js');

var router = new express.Router();
exports.router = router;

router.get('/1/raw_jobs/job_list/', get_job_list);
router.get('/1/raw_jobs/live_list/', get_live_list);
router.get('/1/raw_jobs/query/', query_database);
router.put('/1/raw_jobs/job_list/', edit_job);

router.get('/1/raw_jobs/role_list/', get_role_list);
router.get('/1/raw_jobs/company_list/', get_company_list);
router.get('/1/raw_jobs/industry_list/', get_industry_list);
router.get('/1/raw_jobs/skill_list/', get_skill_list);
router.get('/1/raw_jobs/employer_list/', get_employer_list);
router.get('/1/raw_jobs/schedule_list/', get_schedule_list);
router.get('/1/raw_jobs/job_type_list/', get_job_type_list);
// router.put('/1/raw_jobs/:id', update_job);

function query_database(req, res) {
  var values = [];
  var sql = String(req.query.query).replace(/\>/g, ' ');
  console.log(sql);

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}

function get_job_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "select job_title, job_summ, company, job_loc, salary, job_desc, url, post_date, expiry_date, job_available, search_keyword, search_zip from raw_jobs_2017 group by job_desc";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_live_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from job";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function edit_job(req, res) {
  var this_job = req.body;
  var criteria = this_job['edit_criteria_string'];
  var arg_map = {};
  arg_map[criteria] = this_job[criteria];
  console.log(arg_map);
  var sql = "UPDATE job SET ? WHERE job_id = ? ";
  var values = [arg_map, this_job.job_id];

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
};

function get_industry_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from industry";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_skill_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from job_skill";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_employer_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from employer";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_schedule_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from job_schedule";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_job_type_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from job_type";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_role_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from job_role";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function get_company_list(req, res) {
  var category = req.query.job_category;
  var values = [];
  var sql = "SELECT * from company";
  if (category) {
    sql += ' WHERE `job_category`= ?';
    values.push(category);
  }

  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      var sorted = [];
      for (var i in results) {
        var r = results[i];
        sorted.push(r);
      }
      res.status(200).send(sorted);
    }
  });
}

function update_job(req, res) {
  var sql = "SELECT * FROM `raw_jobs`";
  var id = req.params.id;
  var values = [req.query.job_type];
  db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
    if (error) {
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
//# sourceMappingURL=raw_job.js.map