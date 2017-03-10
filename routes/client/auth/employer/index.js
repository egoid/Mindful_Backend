const express = require('express');
const router = new express.Router();

const employer = require('./employer.js');
const job = require('./job.js');
const job_schedule = require('./job_schedule.js');
const job_applications = require('./job_applications.js');
const employer_favorites = require('./employer_favorites.js');
const employer_messaging = require('./employer_messaging.js');
const employer_tracker = require('./employer_tracker.js');
const employer_skill = require('./employer_skill.js');

exports.router = router;

router.use(employer.router);
router.use(job.router);
router.use(job_schedule.router);

/**
 * New routes - Sprint 3
 */
router.use(job_applications.router);
router.use(employer_favorites.router);
router.use(employer_messaging.router);
router.use(employer_tracker.router);
router.use(employer_skill.router);
