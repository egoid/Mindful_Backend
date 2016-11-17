'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

router.get('/1/employee', get_employee);
router.post('/1/employee', create_employee);
router.put('/1/employee', update_employee);

/**** EMPLOYEE ENDPOINTS ****/
function get_employee(req, res) {
  const sql = "SELECT employee.*, user.alias AS employee_name " +
              "FROM employee " +
              "JOIN user USING(user_id) " +
              "WHERE employee_id=?";
  const values = [req.user.employee_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function create_employee(req, res) {
  const user_id = req.user.user_id;
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

        db.connectAndQuery({sql, values}, (error, results) => {
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
        res.status(200).send({ id: employee_id });
      }
    });
  }
}
function update_employee(req, res) {
  const employee_id = req.user.employee_id;

  const location_name = req.body.location_name || null;
  const UPDATABLE_COLS = [
    'school_id', 'transportation', 'tipi_score_id', 'headline', 'school_level',
    'gpa', 'schedule_id'
  ];

  let search_formatted;
  let search_lat;
  let search_long;

  const update_values = {};

  async.series([
    (done) => {
      if(location_name) {
        geocoder.geocode(location_name)
          .then((res) => {
            update_values.location_name = res[0].formattedAddress;
            update_values.location_latitude = res[0].latitude;
            update_values.location_longitude = res[0].longitude;
            done();
          })
          .catch((err) => {
            console.error("update_employee: geocoding err:", err);
            done(err);
          });
      } else {
        done();
      }
    },
    (done) => {
      _.each(UPDATABLE_COLS, (col) => {
        if(req.body[col]) {
          update_values[col] = req.body[col];
        }
      });

      let sql = "UPDATE employee SET ? WHERE employee_id = ?";
      const values = [update_values, employee_id];
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
