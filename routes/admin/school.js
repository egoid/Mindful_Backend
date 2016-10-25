'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

const router = new express.Router();
exports.router = router;

router.post('/1/school', create_school);
router.get('/1/school/:school_id', get_school);
router.post('/1/school/:school_id', update_school);
router.delete('/1/school/:school_id', delete_school);

function create_school(req, res) {
  const name = req.body.name;
  const location_name = req.body.location_name;

  let school_id;
  let formatted_location;
  let latitude;
  let longitude;

  async.series([
    (done) => {
      geocoder.geocode(job_values.location)
        .then((res) => {
          formatted_location = res[0].formattedAddress;
          latitude = res[0].latitude;
          longitude = res[0].longitude;
          done();
        })
        .catch((err) => {
          console.error("create_school: geocoding err:", err);
          done(err);
        });
    },
    (done) => {
      const sql = "INSERT INTO school (name, location_name, location_latitude, location_longitude) VALUES (?,?,?,?)";
      const values = [name, formatted_location, latitude, longitude];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("create_school: sql err:", error);
        } else {
          school_id = results.insertId;
        }
        done(error);
      });
    }
  ],
  (error) => {
    if(!school_id) {
      res.sendStatus(500);
    } else {
      res.status(201).send(school_id);
    }
  });
}
function get_school(req, res) {
  const sql = "SELECT * FROM school WHERE school_id = ?";
  const values = [req.params.school_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_industry: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function update_school(req, res) {
  const name = req.body.name;
  const location_name = req.body.location_name;

  let school_id;
  let formatted_location;
  let latitude;
  let longitude;

  async.series([
    (done) => {
      geocoder.geocode(job_values.location)
        .then((res) => {
          formatted_location = res[0].formattedAddress;
          latitude = res[0].latitude;
          longitude = res[0].longitude;
          done();
        })
        .catch((err) => {
          console.error("update_school: geocoding err:", err);
          done(err);
        });
    },
    (done) => {
      const sql = "UPDATE school SET name=?, location_name=?, location_latitude=?, location_longitude=? WHERE school_id=?";
      const values = [name, formatted_location, latitude, longitude, req.params.school_id];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("update_school: sql err:", error);
        } else if(results.affectedRows < 1) {
          error = "School not found";
        }
        done(error);
      });
    }
  ],
  (error) => {
    if(error == "School not found") {
      res.sendStatus(404);
    } else if(error) {
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_school(req, res) {
  const sql = "DELETE FROM school WHERE school_id = ?";
  const values = [req.params.school_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_school: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
