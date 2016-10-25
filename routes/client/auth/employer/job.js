'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/job', create_job);
router.post('/1/job/:job_id', update_job);
router.delete('/1/job/:job_id', delete_job);

function _extract_job_def(req) {
  return {
    company_id: req.body.company_id,
    job_role_id: req.body.job_role_id,
    job_type_id: req.body.job_type_id,
    employer_id: req.user.employer_id,
    title: req.body.title,
    location: req.body.location || null,
    pay_rate_min: req.body.pay_rate_min || null,
    pay_rate_max: req.body.pay_rate_max || null,
    min_gpa: req.body.min_gpa || null,
    description: req.body.description || null,
    external_url: req.body.external_url || null,
    posted_at: req.body.posted_at || null,
    takedown_at: req.body.takedown_at || null,
    job_schedule_id: req.body.job_schedule_id || null
  };
}

function create_job(req, res) {
  if(!req.user.employer_id) {
    res.sendStatus(400);
    return;
  }

  const job_values = _extract_job_def(req);

  let connection;
  let latitude = null;
  let longitude = null;
  let radius_coordinates = {};

  async.series([
    (done) => {
      db.getConnection((error, conn) => {
        if(error) {
          console.error("create_job: sql err:", error);
        }
        connection = conn;
        done(error);
      });
    },
    (done) => {
      db.queryWithConnection(connection, "START TRANSACTION", [], (error) => {
        if(error) {
          console.error("create_job: sql err:", error);
        }
        done(error);
      });
    },
    (done) => {
      if(job_values.location) {
        geocoder.geocode(job_values.location)
          .then((res) => {
            job_values.location = res[0].formattedAddress;
            latitude = res[0].latitude;
            longitude = res[0].longitude;
            done();
          })
          .catch((err) => {
            console.error("create_job: geocoding err:", err);
            done(err);
          });
      } else {
        done();
      }
    },
    (done) => {
      _.each(Object.keys(LABEL_TO_RADIUS), (label) => {
        const radius = LABEL_TO_RADIUS[label];
        radius_coordinates[label] = _radius_lat_long_calc(latitude, longitude, radius);
      });
      done();
    },
    (done) => {
      const columns = [];
      const values = [];

      _.each(Object.keys(job_values), (column_name, count) => {
        columns.push(column_name);
        values.push(job_values[column_name]);
      });

      // Latitude is the Y axis, longitude is the X axis
      _.each(Object.keys(radius_coordinates), (label) => {
        columns.push('latitude_lower_' + label);
        columns.push('longitude_lower_' + label);
        columns.push('latitude_upper_' + label);
        columns.push('longitude_upper_' + label);

        values.push(radius_coordinates[label][3]);
        values.push(radius_coordinates[label][2]);
        values.push(radius_coordinates[label][1]);
        values.push(radius_coordinates[label][0]);
      });

      columns.push('latitude, longitude');
      values.push(latitude, longitude);

      const sql = "INSERT INTO job (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0,-1) + ")";
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("create_job: sql err:", error);
        }
        done(error, results.insertId);
      });
    },
    (done) => {
      db.commit(connection, done);
    },
  ],
  (error, result) => {
    if(error) {
      db.rollback(connection, () => {});
      console.error("create_job: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(result);
    }
  });
}
function update_job(req, res) {
  const job_values = _extract_job_def(req);
  const job_id = req.params.job_id;

  if(!job_values.company_id || !job_values.job_role_id || !job_values.job_type_id) {
    res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
  } else {
    const sql = "UPDATE job SET ? WHERE job_id = ? AND employer_id = ?";
    db.connectAndQuery({sql, values: [job_values, job_id, req.user.employer_id]}, (error, results) => {
      if(error) {
        console.error("update_job: sql err:", error);
        res.sendStatus(500);
      } else {
        if(results.affectedRows < 1) {
          res.sendStatus(404);
        } else {
          res.status(200).send({ id: job_id });
        }
      }
    });
  }
}
function delete_job(req, res) {
  const values = [req.params.job_id, req.user.employer_id];
  const sql = "DELETE FROM job WHERE job_id = ? AND employer_id = ?";
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_job: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
