'use strict';

var express = require('express');
var router = new express.Router();

var employer = require('./employer.js');
var job = require('./job.js');
var job_schedule = require('./job_schedule.js');
var job_applications = require('./job_applications.js');
var employer_favorites = require('./employer_favorites.js');
var employer_messaging = require('./employer_messaging.js');
var employer_tracker = require('./employer_tracker.js');

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
//# sourceMappingURL=index.js.map