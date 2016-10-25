'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

router.get('/1/gen_job_latlong', regenerate_lat_long)

router.post('/1/job_role', create_job_role);
router.post('/1/job_type', create_job_type);

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
  'created_at',
  'created_by',
  'modified_at',
  'modified_by',
  'is_deleted',
  'deleted_at',
  'deleted_by',
  'location'
];
const COMPANY_KEYS = [
  'company_id',
  'name',
  'industry_id',
  'email_domain',
  'property_bag',
  'created_at',
  'created_by',
  'modified_at',
  'modified_by',
  'is_deleted',
  'deleted_at',
  'deleted_by',
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
  'job_skill_id',
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
const SCHEDULE_VALUES = ['all','none','morning','afternoon','evening','night'];

function _create_job_role(role_def, conn, all_done) {
  if(role_def.id) {
    all_done(null, role_def.id);
  } else {
    let role_id
    async.series([
      (done) => {
        const sql = "SELECT job_role_id FROM job_role WHERE job_role_descr = ?";
        const values = [role_def.type];
        db.queryWithConnection(conn, sql , values, (error, results) => {
          if(error) {
            console.error("_create_job_role: sql err:", error);
          } else if(results.length > 0) {
            role_id = results[0].job_role_id;
          }
          done(error);
        });
      },
      (done) => {
        if(!role_id) {
          const sql = "INSERT IGNORE INTO job_role (job_role_name, job_role_descr) VALUES (?, ?)";
          const values = [role_def.name, role_def.type];
          db.queryWithConnection(conn, sql, values, (error, results) => {
            if(error) {
              console.error("_create_job_role: sql err:", error);
            } else {
              role_id = results.insertId;
            }
            done(error);
          });
        } else {
          done();
        }
      }
    ],
    (error) => {
      all_done(error, role_id);
    });
  }
}
function _create_job_type(type_def, conn, all_done) {
  if(type_def.id) {
    all_done(null, type_def.id);
  } else {
    let type_id;
    async.series([
      (done) => {
        const sql = "SELECT job_type_id FROM job_type WHERE job_type_descr = ?";
        const values = [type_def.type];
        db.queryWithConnection(conn, sql , values, (error, results) => {
          if(error) {
            console.error("_create_job_type: sql err:", error);
          } else if(results.length > 0) {
            type_id = results[0].job_type_id;
          }
          done(error);
        });
      },
      (done) => {
        if(!type_id) {
          const sql = "INSERT IGNORE INTO job_type (job_type_name, job_type_descr) VALUES (?, ?)";
          const values = [type_def.name, type_def.type];
          db.queryWithConnection(conn, sql, values, (error, results) => {
            if(error) {
              console.error("_create_job_type: sql err:", error);
            } else {
              type_id = results.insertId;
            }
            done(error);
          });
        } else {
          done();
        }
      },
    ],
    (error) => {
      all_done(error, type_id);
    });
  }
}

function _radius_lat_long_calc(lat, lon, radius) {
  const R  = 3959;
  const x1 = lon - _to_degrees(radius/R/Math.cos(_to_radians(lat)));
  const x2 = lon + _to_degrees(radius/R/Math.cos(_to_radians(lat)));
  const y1 = lat + _to_degrees(radius/R);
  const y2 = lat - _to_degrees(radius/R);

  return [x1, y1, x2, y2];
}
function _to_degrees(radians) {
  return radians * 180 / Math.PI;
}
function _to_radians(degrees) {
  return degrees * Math.PI / 180;
}

function create_job_role(req, res) {
  let connection;
  let job_role_id;

  const job_role_def = req.body;

  async.series([
    (done) => {
      db.getConnection((error, conn) => {
        if(error) {
          console.error("create_job_role: sql err:", error);
        }
        connection = conn;
        done(error);
      });
    },
    (done) => {
      _create_job_role(job_role_def, connection, (error, id) => {
        if(error) {
          console.error("create_job_role: sql err:", error);
        }

        job_role_id = id;
        done(error);
      });
    },
    (done) => {
      db.commit(connection, done);
    },
  ],
  (error) => {
    if(error) {
      db.rollback();
      res.sendStatus(500);
    } else {
      res.status(200).send({id: job_role_id});
    }
  });
}
function create_job_type(req, res) {
  let connection;
  let job_type_id;

  const job_type_def = req.body;

  async.series([
    (done) => {
      db.getConnection((error, conn) => {
        if(error) {
          console.error("create_job_type: sql err:", error);
        }
        connection = conn;
        done(error);
      });
    },
    (done) => {
      _create_job_type(job_type_def, connection, (error, id) => {
        if(error) {
          console.error("create_job_type: sql err:", error);
        }

        job_type_id = id;
        done(error);
      });
    },
    (done) => {
      db.commit(connection, done);
    },
  ],
  (error) => {
    if(error) {
      db.rollback();
      res.sendStatus(500);
    } else {
      res.status(200).send({id: job_type_id});
    }
  });
}
function regenerate_lat_long(req, res) {
  const sql = "SELECT job_id, location " +
              "FROM job " +
              "WHERE location is NOT NULL AND latitude IS NULL OR longitude IS NULL";

  db.connectAndQuery({sql, values: []}, (err, results) => {
    _.each(results, (a_result) => {
      let job_values = {};
      let radius_coordinates = {};

      async.series([
        (done) => {
          geocoder.geocode(a_result.location)
            .then((res) => {
              job_values.location = res[0].formattedAddress;
              job_values.latitude = res[0].latitude;
              job_values.longitude = res[0].longitude;
              done();
            })
            .catch((err) => {
              console.error("regenerate_lat_long: geocoding err:", err);
              done(err);
            });
        },
        (done) => {
          _.each(Object.keys(LABEL_TO_RADIUS), (label) => {
            radius_coordinates[label] = _radius_lat_long_calc(job_values.latitude,
                                                              job_values.longitude,
                                                              LABEL_TO_RADIUS[label]);
          });
          done();
        },
        (done) => {
          _.each(Object.keys(radius_coordinates), (label) => {
            job_values['latitude_lower_' + label] = radius_coordinates[label][3];
            job_values['longitude_lower_' + label] = radius_coordinates[label][2];
            job_values['latitude_upper_' + label] = radius_coordinates[label][1];
            job_values['longitude_upper_' + label] = radius_coordinates[label][0];
          });
          done();
        },
        (done) => {
          const sql = "UPDATE job SET ? WHERE job_id = ?";
          const values = [job_values, a_result.job_id];
          db.connectAndQuery({sql, values}, (err, result) => {
            if(err) {
              console.error("regenerate_lat_long: sql err:", err);
            } else if(result.affectedRows < 1) {
              console.error("regenerate_lat_long: update affected 0 rows");
            }
            done(err);
          });
        }
      ],
      (err) => {
        if(err) {
          console.error(a_result, "failed update");
        }
      });
    });

    res.sendStatus(200);
  });


}
