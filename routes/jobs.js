'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const ejs = require('ejs');
const config = require('node-config-sets');

const db = require('../db.js');
const session = require('../session.js');
const util = require('../util.js');

const router = new express.Router();
exports.router = router;

router.get('/1/jobs', session.requireValidSession, get_jobs);

function get_jobs(req, res) {
  res.send({ Testing: true });
}
