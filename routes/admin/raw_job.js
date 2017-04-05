'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db.js');

const router = new express.Router();
exports.router = router;

router.get('/1/raw_jobs/user_list/', get_user_list);

function get_user_list(req,res) {
  const values = [];
  let sql = "show tables" 

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {  
      res.status(200).send(results);
    }
  });
};
