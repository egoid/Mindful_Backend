'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');

const db = require('../../mysql_db_prod.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);
const SCHEDULE_VALUES = ['all','none','morning','afternoon','evening','night'];
const EMPLOYEE_JOB_STATUS = ['saved','submitted','reviewed','interview','offer','pass'];

router.post('/1/employee', create_employee);

router.get('/1/employee/:employee_id', get_employee);
router.put('/1/employee/:employee_id', update_employee);

/*** GET Jobs, Skills, Schedule, and Experience by Employee ID **/
router.get('/1/employee/:employee_id/job', get_employee_jobs_by_employee);
router.get('/1/employee/:employee_id/skill', get_employee_skill_by_employee);
router.get('/1/employee/:employee_id/schedule', get_employee_sched_by_employee);
router.get('/1/employee/:employee_id/experience', get_employee_experience_by_employee);

router.post('/1/employee/:employee_id/job', add_employee_job);
router.post('/1/employee/:employee_id/skill', add_employee_skill);
router.post('/1/employee/:employee_id/schedule', add_employee_sched);
router.post('/1/employee/:employee_id/experience', add_employee_experience);

router.get('/1/experience/:experience_id', get_employee_experience)
router.delete('/1/experience/:experience_id', delete_employee_experience);

router.get('/1/employee_job/:employee_job_id', get_employee_job);
router.put('/1/employee_job/:employee_job_id', update_employee_job);
router.delete('/1/employee_job/:employee_job_id', delete_employee_job);

router.get('/1/employee_skill/:employee_skill_id', get_employee_skill)
router.delete('/1/employee_skill/:employee_skill_id', delete_employee_skill);

router.get('/1/employee_schedule/:employee_sched_id', get_employee_sched);
router.put('/1/employee_schedule/:employee_sched_id', update_employee_sched);
router.delete('/1/employee_schedule/:employee_sched_id', delete_employee_sched);

/**** EMPLOYEE ENDPOINTS ****/
function get_employee(req, res) {
  const sql = "SELECT employee.*, user.alias AS employee_name " +
              "FROM employee " +
              "JOIN user USING(user_id) " +
              "WHERE employee_id = ?";
  const values = [req.params.employee_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function create_employee(req, res) {
  const user_id = req.body.user_id;
  if(!user_id) {
    res.status(400).send('User ID required');
  } else {
    const school_id = req.body.school_id || null;
    const location_name = req.body.location_name || null;
    const transportation = req.body.transportation || null;
    const tipi_score_id = req.body.tipi_score_id || null;
    const headline = req.body.headline || null;
    const school_level = req.body.school_level || null;
    const gpa = req.body.gpa || null;
    const schedule_id = req.body.schedule_id || null;

    let search_formatted;
    let search_lat;
    let search_long;
    let employee_id;

    async.series([
      (done) => {
        if(location_name) {
          geocoder.geocode(location_name)
            .then((res) => {
              search_formatted = res[0].formattedAddress;
              search_lat = res[0].latitude;
              search_long = res[0].longitude;
              done();
            })
            .catch((err) => {
              console.error("create_employee: geocoder err:", err);
              done(err);
            });
        } else {
          done();
        }
      },
      (done) => {
        const sql = "INSERT INTO employee " +
        "(user_id, school_id, location_name, location_latitude, " +
        "location_longitude, transportation, tipi_score_id, " +
        "headline, school_level, gpa, schedule_id) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        const values = [
          user_id, school_id, search_formatted, search_lat, search_long,
          transportation, tipi_score_id, headline, school_level, gpa, schedule_id
        ];

        db.connectAndQuery({sql, values}, (error, results) {
          if(error) {
            console.error("create_employee: sql err:", error);
          } else {
            employee_id = results.insertId;
          }

          done(error);
        });
      }
    ],
    (error) => {
      if(error) {
        res.sendStatus(500);
      } else {
        res.status(201).send(employee_id);
      }
    });
  }
}
function update_employee(req, res) {
  const location_name = req.body.location_name || null;
  const UPDATABLE_COLS = [
    'school_id', 'transportation', 'tipi_score_id', 'headline', 'school_level',
    'gpa', 'schedule_id'
  ];

  let search_formatted;
  let search_lat;
  let search_long;

  async.series([
    (done) => {
      if(location_name) {
        geocoder.geocode(location_name)
          .then((res) => {
            search_formatted = res[0].formattedAddress;
            search_lat = res[0].latitude;
            search_long = res[0].longitude;
            done();
          })
          .catch((err) => {
            console.error("update_employee: geocoding err:", err);
            done(err);
          });
      }
    },
    (done) => {
      let sql = "UPDATE employee SET ";
      const columns = [];
      const values = [];

      if(search_formatted) {
        columns.push('location_name=?', 'location_latitude=?', 'location_longitude=?');
        values.push(search_formatted, search_lat, search_long);
      }

      _.each(UPDATABLE_COLS, (col) => {
        if(req.body[col]) {
          columns.push(col + "=?");
          values.push(req.body[col]);
        }
      });

      sql = sql + columns.join(",");
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("update_employee: sql err:", error);
        }
        done(error);
      });
    }
  ],
  (error) => {
    if(error) {
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

function get_employee_jobs_by_employee(req, res) {
  const sql = {
    sql: "SELECT employee_job.*, job.* FROM employee_job JOIN job USING(job_id) WHERE employee_id = ?",
    nestedTables: true
  };
  const values = [req.params.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_jobs_by_employee: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function get_employee_skill_by_employee(req, res) {
  const sql = "SELECT * FROM employee_skill WHERE employee_id = ?";
  const values = [req.params.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_skill_by_employee: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function get_employee_sched_by_employee(req, res) {
  const sql = "SELECT * FROM employee_schedule WHERE employee_id = ?";
  const values = [req.params.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_sched_by_employee: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function get_employee_experience_by_employee(req, res) {
  const sql = "SELECT * FROM employee_experience WHERE employee_id = ?";
  const values = [req.params.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_experience_by_employee: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}

/**** EMPLOYEE SCHEDULE ENDPOINTS ****/
function get_employee_sched(req, res) {
  const sql = "SELECT * FROM employee_schedule WHERE employee_schedule_id = ?";
  const values = [req.params.employee_schedule_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_sched: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function add_employee_sched(req, res) {
  const employee_id = req.params.employee_id;
  if(!req.body.schedule || req.body.schedule.length < 7) {
    res.status(400).send('Seven day schedule required.');
  } else {
    const values = [employee_id];
    const schedule = req.body.schedule;
    _.each(schedule, (schedule_day) => {
      if(SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
        values.push("none");
      } else {
        values.push(schedule_day);
      }
    });

    const sql = "INSERT INTO employee_schedule " +
                "(employee_id, sunday_schedule, monday_schedule, " +
                " tuesday_schedule, wednesday_schedule, thursday_schedule, " +
                " friday_schedule, saturday_schedule) VALUES "
                "(?)";
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        consle.error(error);
        res.sendStatus(500);
      } else {
        res.status(201).send(results.insertId);
      }
    });
  }
}
function update_employee_sched(req, res) {
  const employee_schedule_id = req.params.employee_schedule_id;
  if(!req.body.schedule || req.body.schedule.length < 7) {
    res.status(400).send('Seven day schedule required.');
  } else {
    const arg_map = {};
    const schedule = req.body.schedule;
    const day_list = ['sunday_schedule', 'monday_schedule', 'tuesday_schedule',
                      'wednesday_schedule', 'thursday_schedule', 'friday_schedule',
                      'saturday_schedule'];
    _.each(day_list, (day_column_name, i) => {
      let schedule_day = schedule[i];
      if(SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
        arg_map[day_column_name] = 'none';
      } else {
        arg_map[day_column_name] = schedule[i];
      }
    });

    const sql = "UPDATE employee_schedule SET ? WHERE employee_schedule_id = ?";
    const values = [arg_map, employee_schedule_id];
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        console.error("update_employee_sched: sql err:", error);
        res.sendStatus(500);
      } else if(results.affectedRows < 1) {
        res.sendStatus(404);
      } else {
        res.sendStatus(200);
      }
    });
  }
}
function delete_employee_sched(req, res) {
  const sql = "DELETE FROM employee_schedule WHERE employee_schedule_id = ?";
  const values = [req.params.employee_schedule_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_sched: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

/**** EMPLOYEE EXPERIENCE ENDPOINTS ****/
function get_employee_experience(req, res) {
  const sql = "SELECT * FROM employee_experience WHERE employee_experience_id = ?";
  const values = [req.params.experience_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_experience: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function add_employee_experience(req, res) {
  const employee_id = req.params.employee_id;

  if(!req.body.company || !req.body.job_role_id || !req.body.start_date) {
    res.status(400).send('Company, job role ID, and start date are required.');
  } else {
    const company = req.body.company;
    const job_role_id = req.body.job_role_id;
    const start = req.body.start_date;
    const end = req.body.end_date || null;

    const sql = "INSERT INTO employee_experience " +
                "(employee_id, company, job_role_id, start_date, end_date) VALUES "
                "(?, ?, ?, ?, ?)";
    const values = [employee_id, company, job_role_id, start, end];
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        consle.error(error);
        res.sendStatus(500);
      } else {
        res.status(201).send(results.insertId);
      }
    });
  }
}
function delete_employee_experience(req, res) {
  const sql = "DELETE FROM employee_experience WHERE employee_experience_id = ?";
  const values = [req.params.experience_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_experience: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

/**** EMPLOYEE JOB ENDPOINTS ****/
function get_employee_job(req, res) {
  const sql = "SELECT * FROM employee_job WHERE employee_job_id = ?";
  const values = [req.params.employee_job_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function add_employee_job(req, res) {
  const employee_id = req.params.employee_id;
  const job_id = req.body.job_id;
  const interview_date = req.body.interview_date;
  let job_status = req.body.status;

  if(EMPLOYEE_JOB_STATUS.indexOf(job_status) < 0) {
    job_status = NULL;
  }

  const sql = "INSERT INTO employee_role " +
              "(employee_id, job_id, status, interview_date) VALUES (?,?,?,?)";
  const values = [employee_id, job_id, job_status, interview_date];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("add_employee_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(201).send(results.insertId);
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

  const sql = "UPDATE employee_job SET status = ?, interview_date = ? WHERE employee_job_id = ?";
  const values = [job_status, interview_date, employee_job_id];
  db.connectAndQuery({sql, values}, (error, results) {
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
  const sql = "DELETE FROM employee_job WHERE employee_job_id = ?";
  const values = [req.params.employee_job_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

/**** EMPLOYEE SKILL ENDPOINTS ****/
function get_employee_skill(req, res) {
  const sql = "SELECT * FROM employee_skill WHERE employee_role_id = ?";
  const values = [req.params.employee_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
function add_employee_skill(req, res) {
  const employee_id = req.params.employee_id;
  const skill_type_id = req.body.skill_type_id;

  const sql = "INSERT INTO employee_skill (employee_id, skill_type_id) VALUES (?,?)";
  const values = [employee_id, skill_type_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("add_employee_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_employee_skill(req, res) {
  const sql = "DELETE FROM employee_skill WHERE employee_role_id = ?";
  const values = [req.params.employee_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
