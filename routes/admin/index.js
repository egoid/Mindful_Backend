const express = require('express');

const company = require('./company.js');
const employer = require('./employer.js');
const industry = require('./industry.js');
const job = require('./job.js');
const raw_job = require('./raw_job.js');
const live_job = require('./live_job.js');
const school = require('./school.js');
const shift_type = require('./shift_type.js');
const skill_type = require('./skill_type.js');
const user_role = require('./user_role.js');
const user_type = require('./user_type.js');

const router = new express.Router();

exports.router = router;
router.use(company.router);
router.use(employer.router);
router.use(industry.router);
router.use(job.router);
router.use(raw_job.router);
router.use(live_job.router);
router.use(school.router);
router.use(shift_type.router);
router.use(skill_type.router);
router.use(user_role.router);
router.use(user_type.router);
