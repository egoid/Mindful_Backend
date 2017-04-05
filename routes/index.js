'use strict';

const express = require('express');
const router = new express.Router();

var admin_routes = require('./admin');

exports.router = router;

router.use('/admin', admin_routes.router);

function require_admin(req, res, next) {
  res.sendStatus(403);
}
