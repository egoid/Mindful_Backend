'use strict';

const express = require('express');
const router = new express.Router();

var util = require('../util.js');
var db = require('../db.js');

var jobs = require('./jobs.js');

exports.router = router;

router.use('/', jobs.router);
