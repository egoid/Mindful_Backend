const express = require('express');
const router = new express.Router();

const company = require('./company.js');
const employee = require('./employee.js');
const employer = require('./employer.js');
const industry = require('./industry.js');
const job = require('./job.js');
const school = require('./school.js');
const shift_type = require('./shift_type.js');
const skill_type = require('./skill_type.js');
const tipi = require('./tipi.js');
const user = require('./user.js');

exports.router = router;

router.use(company.router);
router.use(employee.router);
router.use(employer.router);
router.use(industry.router);
router.use(job.router);
router.use(school.router);
router.use(shift_type.router);
router.use(skill_type.router);
router.use(tipi.router);
router.use(user.router);
