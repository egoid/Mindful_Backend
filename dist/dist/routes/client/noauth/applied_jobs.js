'use strict';

var _ = require('lodash');
var async = require('async');
var express = require('express');
var db = require('../../../../mysql_db_prod.js');

var router = new express.Router();
exports.router = router;

/**
 *  ROUTES
 */
router.post('/1/applied_jobs', create_applied_jobs);
router.post('/1/applied_jobs/:applied_jobs_id', update_applied_jobs);
router.delete('/1/applied_jobs/:applied_jobs_id', delete_applied_jobs);

/**
 * Description:  Applied jobs parameters from the request
 * @param req
 * @returns {{company_id: *, applied_job_id: *, applied_job_type_id: *, employer_id: *, employee_id: *, status, reviewed_by_id: *}}
 * @private
 */
function _extract_job_def(req) {
	return {
		company_id: req.body.company_id,
		applied_job_id: req.body.applied_job_id,
		applied_job_type_id: req.body.applied_job_type_id,
		employer_id: req.user.employer_id,
		employee_id: req.user.employee_id,
		status: req.user.status,
		reviewed_by_id: req.user.reviewed_by_id

	};
}

function create_applied_jobs(req, res) {

	if (!req.user.applied_job_id && !req.user.employer_id) {
		res.sendStatus(400);
		return;
	}

	var job_values = _extract_job_def(req);
	var connection = void 0;

	async.series([function (done) {
		db.getConnection(function (error, conn) {
			if (error) {
				console.error("create_applied_jobs: sql err:", error);
			}
			connection = conn;
			done(error);
		});
	}, function (done) {

		db.queryWithConnection(connection, "START TRANSACTION", [], function (error) {
			if (error) {
				console.error("create_applied_jobs: sql err:", error);
			}
			done(error);
		});
	}, function (done) {

		var columns = [];
		var values = [];

		_.each(Object.keys(job_values), function (column_name, count) {
			columns.push(column_name);
			values.push(job_values[column_name]);
		});

		var sql = "INSERT INTO applied_jobs (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		db.queryWithConnection(connection, sql, values, function (error, results) {
			if (error) {
				console.error("create_applied_jobs: sql err:", error);
			}
			done(error, results.insertId);
		});
	}, function (done) {
		db.commit(connection, done);
	}], function (error, result) {
		if (error) {
			db.rollback(connection, function () {});
			console.error("create_applied_jobs: sql err:", error);
			res.sendStatus(500);
		} else {
			res.status(200).send(result);
		}
	});
}
function update_applied_jobs(req, res) {
	var applied_job_values = _extract_job_def(req);
	var applied_job_id = req.params.applied_job_id;

	if (!applied_job_values.company_id || !applied_job_values.applied_job_type_id) {
		res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
	} else {
		var sql = "UPDATE applied_jobs SET ? WHERE applied_job_id = ? AND employer_id = ?";
		db.connectAndQuery({ sql: sql, values: [applied_job_values, applied_job_id, req.user.employer_id] }, function (error, results) {
			if (error) {
				console.error("update_applied_jobs: sql err:", error);
				res.sendStatus(500);
			} else {
				if (results.affectedRows < 1) {
					res.sendStatus(404);
				} else {
					res.status(200).send({ id: applied_job_id });
				}
			}
		});
	}
}
function delete_applied_jobs(req, res) {
	var values = [req.params.applied_job_id, req.user.employer_id];
	var sql = "DELETE FROM applied_jobs WHERE applied_job_id = ? AND employer_id = ?";
	db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
		if (error) {
			console.error("delete_applied_jobs: sql err:", error);
			res.sendStatus(500);
		} else if (results.affectedRows < 1) {
			res.sendStatus(404);
		} else {
			res.sendStatus(200);
		}
	});
}
//# sourceMappingURL=applied_jobs.js.map
//# sourceMappingURL=applied_jobs.js.map