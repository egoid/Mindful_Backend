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

router.get('/1/employee/:employee_id', get_employee);
router.post('/1/employee', create_employee);
router.put('/1/employee/:employee_id', update_employee);

router.get('/1/experience/:experience_id', get_employee_experience)
router.post('/1/employee/:employee_id/experience', add_employee_experience);
router.delete('/1/experience/:experience_id', delete_employee_experience);

router.get('/1/employee_job/:employee_job_id', get_employee_job)
router.post('/1/employee/:employee_id/job', add_employee_job);
router.delete('/1/employee_job/:employee_job_id', delete_employee_job);

router.get('/1/employee_role/:employee_role_id', get_employee_job_role)
router.post('/1/employee/:employee_id/role', add_employee_job_role);
router.delete('/1/employee_role/:employee_role_id', delete_employee_job_role);

router.get('/1/employee_skill/:employee_skill_id', get_employee_skill)
router.post('/1/employee/:employee_id/skill', add_employee_skill);
router.delete('/1/employee_skill/:employee_skill_id', delete_employee_skill);

/**** EMPLOYEE ENDPOINTS ****/
get_employee(req, res) {
  const sql = "SELECT employee.*, user.alias AS employee_name " +
              "FROM employee " +
              "JOIN user USING(user_id) " +
              "WHERE employee_id = ?";
  const values = [req.params.employee_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_current error", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
create_employee(req, res) {
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
              console.error(err);
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
            console.error(error);
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
update_employee(req, res) {
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
            console.error(err);
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
          console.error(error);
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

/**** EMPLOYEE EXPERIENCE ENDPOINTS ****/
get_employee_experience(req, res) {
  const sql = "SELECT * FROM employee_experience WHERE employee_experience_id = ?";
  const values = [req.params.experience_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
add_employee_experience(req, res) {
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
delete_employee_experience(req, res) {
  const sql = "DELETE FROM employee_experience WHERE employee_experience_id = ?";
  const values = [req.params.experience_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

/**** EMPLOYEE JOB ENDPOINTS ****/
get_employee_job(req, res) {
  const sql = "SELECT * FROM employee_job WHERE employee_job_id = ?";
  const values = [req.params.employee_job_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
add_employee_job(req, res) {
  const employee_id = req.params.employee_id;
  const job_id = req.body.job_id;
  const job_status = req.body.status;
  const interview_date = req.body.interview_date;

  const sql = "INSERT INTO employee_role " +
              "(employee_id, job_id, status, interview_date) VALUES (?,?,?,?)";
  const values = [employee_id, job_id, job_status, interview_date];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(201).send(results.insertId);
    }
  });
}
delete_employee_job(req, res) {
  const sql = "DELETE FROM employee_job WHERE employee_job_id = ?";
  const values = [req.params.employee_job_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

/**** EMPLOYEE JOB ROLE ENDPOINTS ****/
get_employee_job_role(req, res) {
  const sql = "SELECT * FROM employee_role WHERE employee_role_id = ?";
  const values = [req.params.employee_role_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
add_employee_job_role(req, res) {
  const employee_id = req.params.employee_id;
  const job_role_id = req.body.job_role_id;

  const sql = "INSERT INTO employee_role (employee_id, job_role_id) VALUES (?,?)";
  const values = [employee_id, job_role_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(201).send(results.insertId);
    }
  });
}
delete_employee_job_role(req, res) {
  const sql = "DELETE FROM employee_role WHERE employee_role_id = ?";
  const values = [req.params.employee_role_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

/**** EMPLOYEE SKILL ENDPOINTS ****/
get_employee_skill(req, res) {
  const sql = "SELECT * FROM employee_skill WHERE employee_role_id = ?";
  const values = [req.params.employee_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
add_employee_skill(req, res) {
  const employee_id = req.params.employee_id;
  const skill_type_id = req.body.skill_type_id;

  const sql = "INSERT INTO employee_skill (employee_id, skill_type_id) VALUES (?,?)";
  const values = [employee_id, skill_type_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
delete_employee_skill(req, res) {
  const sql = "DELETE FROM employee_skill WHERE employee_role_id = ?";
  const values = [req.params.employee_skill_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
