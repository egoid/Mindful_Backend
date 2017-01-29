'use strict';

var _ = require('lodash');
var express = require('express');
var db = require('../../../../mysql_db_prod.js');

var router = new express.Router();
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
		(function () {
			var connection = void 0;
			var schedule_id = void 0;

			var schedule = req.body.schedule;
			var job_id = req.body.job_id;

			async.series([function (done) {
				db.getConnection(function (err, conn) {
					if (err) {
						console.error("create_job: sql err:", err);
					}
					connection = conn;
					done(err);
				});
			}, function (done) {
				var sql = "INSERT INTO job_schedule " + "(sunday_schedule, monday_schedule, " + " tuesday_schedule, wednesday_schedule, thursday_schedule, " + " friday_schedule, saturday_schedule) VALUES ";
				"(?,?,?,?,?,?,?,?)";

				var values = [];
				_.each(schedule, function (schedule_day) {
					if (SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
						values.push("none");
					} else {
						values.push(schedule_day);
					}
				});

				db.queryWithConnection(connection, sql, values, function (err, results) {
					if (err) {
						consle.error("create_job: sql err:", err);
					} else {
						schedule_id = results.insertId;
					}
					done(error);
				});
			}, function (done) {
				var sql = "UPDATE job SET job_schedule_id = ? WHERE job_id = ?";
				var values = [schedule_id, job_id];
				db.queryWithConnection(connection, sql, values, function (err, results) {
					if (err) {
						consle.error(err);
					} else if (results.affectedRows < 1) {
						err = '404';
					}
					done(err);
				});
			}, function (done) {
				db.commit(connection, done);
			}], function (err) {
				if (err) {
					db.rollback(connection, function () {});

					if (err == '404') {
						res.sendStatus(404);
					} else {
						res.sendStatus(500);
					}
				} else {
					res.sendStatus(200);
				}
			});
		})();
	}
}
function update_job_sched(req, res) {
	var job_schedule_id = req.params.job_schedule_id;
	if (!req.body.schedule || req.body.schedule.length < 7) {
		res.status(400).send('Seven day schedule required.');
	} else {
		(function () {
			var arg_map = {};
			var schedule = req.body.schedule;
			var day_list = ['sunday_schedule', 'monday_schedule', 'tuesday_schedule', 'wednesday_schedule', 'thursday_schedule', 'friday_schedule', 'saturday_schedule'];
			_.each(day_list, function (day_column_name, i) {
				var schedule_day = schedule[i];
				if (SCHEDULE_VALUES.indexOf(schedule_day) < 0) {
					arg_map[day_column_name] = 'none';
				} else {
					arg_map[day_column_name] = schedule[i];
				}
			});

			var sql = "UPDATE job_schedule SET ? WHERE job_schedule_id = ?";
			var values = [arg_map, job_schedule_id];
			db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
				if (error) {
					console.error("update_job_sched: sql err:", error);
					res.sendStatus(500);
				} else if (results.affectedRows < 1) {
					res.sendStatus(404);
				} else {
					res.sendStatus(200);
				}
			});
		})();
	}
}
function delete_job_sched(req, res) {
	var sql = "DELETE FROM job_schedule WHERE job_schedule_id = ?";
	var values = [req.params.job_schedule_id];
	db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
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
//# sourceMappingURL=job_schedule.js.map