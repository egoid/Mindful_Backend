'use strict';

const express = require('express');
const db = require('../../mysql_db_prod.js');
const router = new express.Router();

exports.router = router;

router.get('/1/video/:employee_id', get_video);

function get_video(req, res) {
  const employee_id = req.params.employee_id;

  const sql = "SELECT video_url FROM employee where employee_id = ? ";
  const values = [employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_job_skill: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results);
    }
  });
}
