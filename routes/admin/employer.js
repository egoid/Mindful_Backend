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

router.post('/1/employer', create_employer);
router.get('/1/employer/:employer_id', get_employer);
router.put('/1/employer/:employer_id', update_employer);
router.delete('/1/employer/:employer_id', delete_employer);

function get_employer(req, res) {
  const sql = "SELECT employer.*, user.alias AS employee_name " +
              "FROM employer " +
              "JOIN user USING(user_id) " +
              "WHERE employer_id = ?";
  const values = [req.params.employer_id];

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
function create_employer(req, res) {
  const user_id = req.body.user_id;
  if(!user_id) {
    res.status(400).send('User ID required');
  } else {
    const location_name = req.body.location_name || null;

    let search_formatted;
    let search_lat;
    let search_long;
    let employer_id;

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
              console.error("create_employer: geocoding err:", err);
              done(err);
            });
        } else {
          done();
        }
      },
      (done) => {
        const sql = "INSERT INTO employer " +
        "(user_id, location_name, location_latitude, location_longitude) VALUES (?,?,?,?)";
        const values = [user_id, search_formatted, search_lat, search_long];

        db.connectAndQuery({sql, values}, (error, results) => {
          if(error) {
            console.error("create_employer: sql err:", error);
          } else {
            employer_id = results.insertId;
          }

          done(error);
        });
      }
    ],
    (error) => {
      if(error) {
        res.sendStatus(500);
      } else {
        res.status(201).send(employer_id);
      }
    });
  }
}
function update_employer(req, res) {
  const employer_id = req.params.employer_id;
  const location_name = req.body.location_name || null;
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
            console.error("update_employer: geocoding err:", err);
            done(err);
          });
      }
    },
    (done) => {
      if(search_formatted) {
        let sql = "UPDATE employer SET ? WHERE employer_id = ?";
        const values = [{
          location_name: search_formatted,
          location_latitude: search_lat,
          location_longitude: search_long,
        }, employer_id];

        db.connectAndQuery({sql, values}, (error, results) => {
          if(error) {
            console.error("update_employer: sql err:", error);
          }
          done(error);
        });
      } else {
        done();
      }
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
function delete_employer(req, res) {
  const sql = "DELETE FROM employer WHERE employer_id = ?";
  const values = [req.params.employer_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employer: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
