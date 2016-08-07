'use strict';

const express = require('express');
const router = new express.Router();

var prod_jobs = require('./prod');
var pre_prod_jobs = require('./preprod');

exports.router = router;

router.use('/prod', prod_jobs.router);
router.use('/preprod', pre_prod_jobs.router);
