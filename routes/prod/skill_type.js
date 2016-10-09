'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

router.get('/1/skill_type/:skill_type_id', get_skill_type);

function get_skill_type(req, res) {
  const sql = "SELECT * FROM skill_type WHERE skill_type_id = ?";
  const values = [req.params.skill_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_skill_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
