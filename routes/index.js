'use strict';

const express = require('express');
const router = new express.Router();

var admin_routes = require('./admin');
var client_routes = require('./client');

exports.router = router;

router.use('/admin', require_admin, admin_routes.router);
router.use('/client', client_routes.router);

function require_admin(req, res, next) {
  res.sendStatus(403);
}
