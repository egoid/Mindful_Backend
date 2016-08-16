const express = require('express');
const router = new express.Router();

const company = require('./company.js');
const job = require('./job.js');
const user = require('./user.js');

exports.router = router;

router.use(company.router);
router.use(job.router);
router.use(user.router);
