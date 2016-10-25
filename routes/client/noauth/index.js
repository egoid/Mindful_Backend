const express = require('express');

const company = require('./company.js');
const industry = require('./industry.js');
const job = require('./job.js');
const job_schedule = require('./job_schedule.js');
const job_skill = require('./job_skill.js');
const school = require('./school.js');
const shift_type = require('./shift_type.js');
const skill_type = require('./skill_type.js');
const user = require('./user.js');

const router = new express.Router();
exports.router = router;

router.use(company.router);
router.use(industry.router);
router.use(job.router);
router.use(job_schedule.router);
router.use(job_skill.router);
router.use(school.router);
router.use(shift_type.router);
router.use(skill_type.router);
router.use(user.router);
