'use strict';

const express = require('express');
const router = new express.Router();

var admin_routes = require('./admin');
var auth_routes = require('./auth');
var doctor_routes = require('./doctor');

exports.router = router;

router.use('/admin', admin_routes.router);
router.use('/auth', auth_routes.router);
router.use('/doctor', doctor_routes.router);

function require_admin(req, res, next) {
  res.sendStatus(403);
}
