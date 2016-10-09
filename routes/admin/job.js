'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');
const company_util = require('../company.js');

const router = new express.Router();
exports.router = router;

const GOOGLE_GEO_CONFIG = {
  apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
  formatter: null,
  httpAdapter: 'https',
  provider: 'google',
};
const geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

router.post('/1/job', create_job);
router.post('/1/job/:job_id', update_job);
router.delete('/1/job/:job_id', delete_job);
router.get('/1/job/:job_id', get_job);

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
function _extract_job_def(req) {
  return {
    title: req.body.title,
    employer_id: req.body.employer_id,
    location: req.body.location || null,
    pay_rate_min: req.body.pay_rate_min || null,
    pay_rate_max: req.body.pay_rate_max || null,
    min_gpa: req.body.min_gpa || null,
    description: req.body.description || null,
    external_url: req.body.external_url || null,
    posted_at: req.body.posted_at || null,
    takedown_at: req.body.takedown_at || null
  };
}
function _make_job_from_results(results) {
  let result = {};

  if(results.length) {
    let job = _.pick(results[0], JOB_KEYS);
    let job_role = _.pick(results[0], JOB_ROLE_KEYS);
    let job_type = _.pick(results[0], JOB_TYPE_KEYS);
    let company = _.pick(results[0], COMPANY_KEYS);

    let skills = [];
    _.each(results, (r) => {
      skills.push(_.pick(r, SKILL_KEYS));
    });

    company.property_bag = JSON.parse(company.property_bag);

    result = {
      job: Object.assign({}, job, job_role, job_type, company),
      skills,
    };
  }

  return result;
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
function create_job(req, res) {
  const company_def = req.body.company;
  const job_role = req.body.job_role;
  const job_type = req.body.job_type;
  const job_values = _extract_job_def(req);

  let company_id;
  let job_role_id;
  let job_type_id;
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
      company_util.create_company(company_def, connection, (error, result) => {
        if(error) {
          console.error("create_job: create_company err:", error);
        } else {
          company_id = result;
        }
        done(error);
      });
    },
    (done) => {
      _create_job_role(job_role, connection, (error, result) => {
        if(error) {
          console.error("create_job: _create_job_role err:", error);
        } else {
          job_role_id = result;
        }
        done(error);
      });
    },
    (done) => {
      _create_job_type(job_type, connection, (error, result) => {
        if(error) {
          console.error("create_job: _create_job_type err:", error);
        } else {
          job_type_id = result;
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

      columns.push('latitude, longitude, company_id', 'job_role_id', 'job_type_id');
      values.push(latitude, longitude, company_id, job_role_id, job_type_id);

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
function get_job(req, res) {
  const sql = "SELECT job.*, company.* , industry.*, job_role.*, job_type.*, job_skill.*, skill_type.* " +
              "FROM job " +
              "JOIN company USING(company_id) " +
              "JOIN industry USING(industry_id) " +
              "JOIN job_role USING(job_role_id) " +
              "JOIN job_type USING(job_type_id) " +
              "LEFT JOIN job_skill USING(job_id) " +
              "LEFT JOIN skill_type ON job_skill.skill_type_id = skill_type.skill_type_id " +
              "WHERE job_id = ?";
    db.connectAndQuery({sql, values: [req.params.job_id]}, (error, results) => {
      if(error) {
        console.error("get_job: sql err:", error);
        res.sendStatus(500);
      } else if(results.length < 1) {
        res.sendStatus(404);
      } else {
        let result = _make_job_from_results(results);
        res.status(200).send(result);
      }
    });
}
function update_job(req, res) {
  const company_def = req.body.company;
  const job_role = req.body.job_role;
  const job_type = req.body.job_type;
  const job_values = _extract_job_def(req);
  const job_id = req.params.job_id;

  if(!company_def.id || !job_role.id || !job_type.id) {
    res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
  } else {
    const sql = "UPDATE job SET ? WHERE job_id = ?";
    db.connectAndQuery({sql, values: [job_values, job_id]}, (error, results) => {
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
  const values = [req.params.job_id];
  const sql = "DELETE FROM job WHERE job_id = ?";
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
