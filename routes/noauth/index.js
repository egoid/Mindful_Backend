const express = require('express');
const user = require('./user.js');

const router = new express.Router();

exports.router = router;
router.use(user.router);
