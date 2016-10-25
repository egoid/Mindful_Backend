'use strict';

const express = require('express');
const router = new express.Router();

var noauth_routes = require('./noauth');
var auth_routes = require('./auth');

exports.router = router;

router.use(noauth_routes.router);
router.use(auth_routes.router);
