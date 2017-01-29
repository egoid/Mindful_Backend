'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/job_schedule', create_job_sched);
router.post('/1/job_schedule/:job_sched_id', update_job_sched);
router.delete('/1/job_schedule/:job_sched_id', delete_job_sched);

function create_job_sched(req, res) {
    if (!req.body.schedule || req.body.schedule.length < 7) {
	res.status(400).send('Seven day schedule required.');
    } else if (!req.body.job_id) {
	res.status(400).send('Job ID required.');
    } else {
	let connection;
	let schedule_id;
	
	const schedule = req.body.schedule;
	const job_id = req.body.job_id;
	
	async.series([
		(done) => {
		    db.getConnection((err, conn) => {
			if (err) {
			    console.error("create_job: sql err:", err);
			}
			connection = conn;
			done(err);
		    });
		},
		(done) => {
		    const sql = "INSERT INTO job_schedule " +
			"(sunday_schedule, monday_schedule, " +
			" tuesday_schedule, wednesday_schedule, thursday_schedule, " +
			" friday_schedule, saturday_schedule) VALUES "
		    "(?,?,?,?,?,?,?,?)";
		    
		    const values = [];
		    _.each(schedule, (schedule_day) => {
			if (SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
			    values.push("none");
			} else {
			    values.push(schedule_day);
			}
		    });
		    
		    db.queryWithConnection(connection, sql, values, (err, results) => {
			if (err) {
			    consle.error("create_job: sql err:", err);
			} else {
			    schedule_id = results.insertId;
			}
			done(error);
		    });
		},
		(done) => {
		    const sql = "UPDATE job SET job_schedule_id = ? WHERE job_id = ?";
		    const values = [schedule_id, job_id];
		    db.queryWithConnection(connection, sql, values, (err, results) => {
			if (err) {
			    consle.error(err);
			} else if (results.affectedRows < 1) {
			    err = '404';
			}
			done(err);
		    });
		},
		(done) => {
		    db.commit(connection, done);
		},
	    ],
	    (err) => {
		if (err) {
		    db.rollback(connection, () => {});
		    
		    if (err == '404') {
			res.sendStatus(404);
		    } else {
			res.sendStatus(500);
		    }
		} else {
		    res.sendStatus(200);
		}
	    });
    }
}
function update_job_sched(req, res) {
    const job_schedule_id = req.params.job_schedule_id;
    if (!req.body.schedule || req.body.schedule.length < 7) {
	res.status(400).send('Seven day schedule required.');
    } else {
	const arg_map = {};
	const schedule = req.body.schedule;
	const day_list = ['sunday_schedule', 'monday_schedule', 'tuesday_schedule',
	    'wednesday_schedule', 'thursday_schedule', 'friday_schedule',
	    'saturday_schedule'];
	_.each(day_list, (day_column_name, i) => {
	    let schedule_day = schedule[i];
	    if (SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
		arg_map[day_column_name] = 'none';
	    } else {
		arg_map[day_column_name] = schedule[i];
	    }
	});
	
	const sql = "UPDATE job_schedule SET ? WHERE job_schedule_id = ?";
	const values = [arg_map, job_schedule_id];
	db.connectAndQuery({sql, values}, (error, results) => {
	    if (error) {
		console.error("update_job_sched: sql err:", error);
		res.sendStatus(500);
	    } else if (results.affectedRows < 1) {
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
	if (error) {
	    console.error("delete_job_sched: sql err:", error);
	    res.sendStatus(500);
	} else if (results.affectedRows < 1) {
	    res.sendStatus(404);
	} else {
	    res.sendStatus(200);
	}
    });
}
