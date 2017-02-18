const express = require('express');
const router = new express.Router();

const employee = require('./employee.js');
const employee_experience = require('./employee_experience.js');
const employee_industry = require('./employee_industry.js');
const employee_job = require('./employee_job.js');
const employee_schedule = require('./employee_schedule.js');
const employee_skill = require('./employee_skill.js');
const employee_tipi = require('./employee_tipi.js');
const employee_tracker = require('./employee_tracker.js');

exports.router = router;
router.use(employee.router);
router.use(employee_experience.router);
router.use(employee_industry.router);
router.use(employee_job.router);
router.use(employee_schedule.router);
router.use(employee_skill.router);
router.use(employee_tipi.router);
router.use(employee_tracker.router);
