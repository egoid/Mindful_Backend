'use strict';

const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.get('/1/shift_type/:shift_type_id', get_shift_type);

function get_shift_type(req, res) {
  const sql = "SELECT * FROM shift_type WHERE shift_type_id = ?";
  const values = [req.params.shift_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_shift_type: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
