const express = require('express');
const router = new express.Router();

const employer = require('./employer.js');
const job = require('./job.js');
const job_schedule = require('./job_schedule.js');

exports.router = router;

router.use(employer.router);
router.use(job.router);
router.use(job_schedule.router);
