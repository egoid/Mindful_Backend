const _ = require('lodash');
const express = require('express');
const router = new express.Router();
const db = require('../../mysql_db_prod.js');
const quiz_routes = require('./quiz');
const patient_routes = require('./patient');

exports.router = router;

router.use(new RegExp(/\/1\/doctor/), require_session_key);

router.use(quiz_routes.router);
router.use(patient_routes.router);

function require_session_key(req, res, next) {
  if(!req.body.session_key) {
    // res.status(403).send("Session-Key Required");
    next();
  } else {
    next();
  }
}