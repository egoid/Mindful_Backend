'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

const SCHEDULE_VALUES = ['all','none','morning','afternoon','evening','night'];

router.get('/1/employee/schedule', get_employee_sched);
router.post('/1/employee/schedule', create_employee_sched);
router.post('/1/employee/schedule/:employee_sched_id', update_employee_sched);
router.delete('/1/employee/schedule/:employee_sched_id', delete_employee_sched);

function get_employee_sched(req, res) {
  const sql = "SELECT * FROM employee_schedule WHERE employee_id = ?";
  const values = [(req.user.employee_id || req.query.employee_id)];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_employee_sched: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      // res.sendStatus(404);
      res.status(200).send([]);
    } else {
      res.status(200).send(results);
    }
  });
}
function create_employee_sched(req, res) {
  const employee_id = req.user.employee_id;
  if(!req.body.schedule || req.body.schedule.length < 7) {
    res.status(400).send('Seven day schedule required.');
  } else {
    const values = [employee_id];
    const schedule = req.body.schedule;
    _.each(schedule, (schedule_day) => {
      if(SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
        values.push("none");
      } else {
        values.push(schedule_day);
      }
    });

    const sql = "INSERT INTO employee_schedule " +
                "(employee_id, sunday_schedule, monday_schedule, " +
                " tuesday_schedule, wednesday_schedule, thursday_schedule, " +
                " friday_schedule, saturday_schedule) VALUES " +
                "(?, ?, ?, ?, ?, ?, ?, ?)";
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        consle.error(error);
        res.sendStatus(500);
      } else {
        res.status(200).send({id: results.insertId});
      }
    });
  }
}
function update_employee_sched(req, res) {
  const employee_schedule_id = req.params.employee_schedule_id;
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

    const sql = "UPDATE employee_schedule SET ? WHERE employee_schedule_id = ? AND employee_id = ?";
    const values = [arg_map, employee_schedule_id, req.user.employee_id];
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        console.error("update_employee_sched: sql err:", error);
        res.sendStatus(500);
      } else if(results.affectedRows < 1) {
        res.sendStatus(404);
      } else {
        res.sendStatus(200);
      }
    });
  }
}
function delete_employee_sched(req, res) {
  const sql = "DELETE FROM employee_schedule WHERE employee_schedule_id = ? AND employee_id = ?";
  const values = [req.params.employee_schedule_id, req.user.employee_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_employee_sched: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
