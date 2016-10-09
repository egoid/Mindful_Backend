'use strict';

const _ = require('lodash');
const express = require('express');

const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/job/:job_id/schedule', create_job_sched);
router.get('/1/job_schedule/:job_sched_id', get_job_sched);
router.post('/1/job_schedule/:job_sched_id', update_job_sched);
router.delete('/1/job_schedule/:job_sched_id', delete_job_sched);

function get_job_sched(req, res) {
  const sql = "SELECT * FROM job_schedule WHERE job_schedule_id = ?";
  const values = [req.params.job_schedule_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_job_sched: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function create_job_sched(req, res) {
  const job_id = req.params.job_id;
  if(!req.body.schedule || req.body.schedule.length < 7) {
    res.status(400).send('Seven day schedule required.');
  } else {
    const values = [job_id];
    const schedule = req.body.schedule;
    _.each(schedule, (schedule_day) => {
      if(SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
        values.push("none");
      } else {
        values.push(schedule_day);
      }
    });

    const sql = "INSERT INTO job_schedule " +
                "(job_id, sunday_schedule, monday_schedule, " +
                " tuesday_schedule, wednesday_schedule, thursday_schedule, " +
                " friday_schedule, saturday_schedule) VALUES "
                "(?,?,?,?,?,?,?,?)";
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        consle.error(error);
        res.sendStatus(500);
      } else {
        res.status(200).send(results.insertId);
      }
    });
  }
}
function update_job_sched(req, res) {
  const job_schedule_id = req.params.job_schedule_id;
  if(!req.body.schedule || req.body.schedule.length < 7) {
    res.status(400).send('Seven day schedule required.');
  } else {
    const arg_map = {};
    const schedule = req.body.schedule;
    const day_list = ['sunday_schedule', 'monday_schedule', 'tuesday_schedule',
                      'wednesday_schedule', 'thursday_schedule', 'friday_schedule',
                      'saturday_schedule'];
    _.each(day_list, (day_column_name, i) => {
      let schedule_day = schedule[i];
      if(SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
        arg_map[day_column_name] = 'none';
      } else {
        arg_map[day_column_name] = schedule[i];
      }
    });

    const sql = "UPDATE job_schedule SET ? WHERE job_schedule_id = ?";
    const values = [arg_map, job_schedule_id];
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        console.error("update_job_sched: sql err:", error);
        res.sendStatus(500);
      } else if(results.affectedRows < 1) {
        res.sendStatus(404);
      } else {
        res.sendStatus(200);
      }
    });
  }
}
function delete_job_sched(req, res) {
  const sql = "DELETE FROM job_schedule WHERE job_schedule_id = ?";
  const values = [req.params.job_schedule_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_job_sched: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
