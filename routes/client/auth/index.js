const _ = require('lodash');
const express = require('express');
const router = new express.Router();
const db = require('../../../mysql_db_prod.js');
const employee_routes = require('./employee');
const employer_routes = require('./employer');
const user = require('./user.js');

exports.router = router;

router.use(require_session_key);
router.use(new RegExp(/\/1\/employee/), require_employee_id);
router.use(new RegExp(/\/1\/employer/), require_employer_id);

router.use(employee_routes.router);
router.use(employer_routes.router);
router.use(user.router);

const USER_FIELDS = [
  "user_id",
  "alias",
  "user_type",
  "email",
  "verified",
  "user_role_id",
  "facebook_id",
  "linkedin_id",
  "is_deleted",
  "employer_id",
  "employee_id"
];

function require_employer_id(req, res, next) {
  if(req.originalUrl === '/client/1/employer' && req.originalMethod === 'POST') {
    next();
  } else if(!req.user.employer_id || req.user.employer_id < 1) {
    res.status(403).send("Unknown employer.");
  } else {
  }
}
function require_employee_id(req, res, next) {
  if(req.originalUrl === '/client/1/employee' && req.originalMethod === 'POST') {
    next();
  } else if(!req.user.employee_id || req.user.employee_id < 1) {
    res.status(403).send("Unknown employee.");
  } else {
    next();
  }
}
function require_session_key(req, res, next) {
  var header_api_key = req.get('X-Yobs-User-Session-Key');
  var session_key = header_api_key || req.cookies.user_session_key;

  if (!session_key) {
    res.status(403).send("X-Yobs-User-Session-Key header or user_session_key cookie is required");
  } else {
    const sql = "SELECT user.*, employer.employer_id, employee.employee_id " +
                "FROM user " +
                "JOIN user_session USING(user_id) " +
                "LEFT JOIN employee USING(user_id) " +
                "LEFT JOIN employer USING(user_id) " +
                "WHERE user_session_key = ?";

    const values = [session_key];
    db.connectAndQuery({sql, values}, (err, results) => {
      if(err) {
        console.error("require_session_key: sql err", err);
        res.sendStatus(500);
      } else if(results.length < 1) {
        res.status(403).send("Unknown user session key.");
      } else {
        req.user = _.pick(results[0], USER_FIELDS);
        next();
      }
    });
  }
}
