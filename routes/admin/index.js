const express = require('express');

const user_role = require('./user_role.js');
const user_type = require('./user_type.js');

const router = new express.Router();

exports.router = router;
router.use(user_role.router);
router.use(user_type.router);
