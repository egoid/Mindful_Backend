'use strict';

const express = require('express');
const db = require('../mysql_db_prod.js');

const router = new express.Router();

var admin_routes = require('./admin');
var noauth_routes = require('./noauth');
var prod_routes = require('./prod');
var pre_prod_routes = require('./preprod');

exports.router = router;

router.use('/', noauth_routes.router);
router.use('/admin', require_admin, admin_routes.router);
router.use('/prod', require_session_key, prod_routes.router);
router.use('/preprod', pre_prod_routes.router);

function require_admin(req, res, next) {
  res.status(403).send("Nope");
}
function require_session_key(req,res,next) {
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
        req.user = results[0];
        next();
      }
    });
  }
}
