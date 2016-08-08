const express = require('express');
const router = new express.Router();
const job = require('./job.js');

exports.router = router;

router.use(job.router);
