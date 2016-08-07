const express = require('express');
const router = new express.Router();
const jobs = require('./jobs.js');

exports.router = router;

router.use(jobs.router);
