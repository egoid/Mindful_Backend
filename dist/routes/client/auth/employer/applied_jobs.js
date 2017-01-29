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
router.get('/1/job_applications', get_job_applications);
router.post('/1/job_applications', create_job_applications);
router.post('/1/job_applications/:applied_job_id', update_job_applications);
router.delete('/1/job_applications/:applied_job_id', delete_job_applications);

/**
 * Description:  Applied jobs parameters from the request
 * @param req
 * @returns {{company_id: *, applied_job_id: *, applied_job_type_id: *, employer_id: *, employee_id: *, status, reviewed_by_id: *}}
 * @private
 */
function _extract_applied_job_def(req) {

	return {
		company_id: req.body.company_id,
		applied_job_id: req.body.applied_job_id,
		applied_job_type_id: req.body.applied_job_type_id,
		employer_id: req.body.employer_id,
		employee_id: req.body.employee_id,
		status: req.body.status,
		reviewed_by_id: req.body.reviewed_by_id

	};
}

function _extract_update_applied_job_def(req) {
	return {
		employer_id: req.body.employer_id,
		status: req.body.status,
		reviewed_by_id: req.body.reviewed_by_id
	};
}

function get_job_applications(req, res) {

	var employer_id = req.query.employer_id;
	var sql = "SELECT company_id, applied_job_id, applied_job_type_id, employer_id, employee_id,status, reviewed_by_id, added_date " + "FROM job_applications " + "WHERE employer_id  = ?";
	var values = [employer_id];

	db.connectAndQuery({ sql: sql, values: values }, function (err, results) {
		if (err) {
			console.error("get_job_applications: sql err:", err);
			res.sendStatus(500);
		} else if (results.length < 1) {
			res.sendStatus(404);
		} else {
			res.status(200).send(results);
		}
	});
}

function create_job_applications(req, res) {

	if (!req.body.applied_job_id && !req.body.employer_id) {
		res.sendStatus(400);
		return;
	}

	var job_values = _extract_applied_job_def(req);
	var connection = void 0;

	async.series([function (done) {
		db.getConnection(function (error, conn) {
			if (error) {
				console.error("create_job_applications: sql err:", error);
			}
			connection = conn;
			done(error);
		});
	}, function (done) {

		db.queryWithConnection(connection, "START TRANSACTION", [], function (error) {
			if (error) {
				console.error("create_job_applications: sql err:", error);
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

		var sql = "INSERT INTO job_applications (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		db.queryWithConnection(connection, sql, values, function (error, results) {

			if (error) {
				console.error("create_job_applications: sql err:", error);
				res.sendStatus(500);
			} else {
				done(error, results.insertId);
			}
		});
	}, function (done) {
		db.commit(connection, done);
	}], function (error, result) {
		if (error) {
			db.rollback(connection, function () {});
			console.error("create_job_applications: sql err:", error);
			res.sendStatus(500);
		} else {
			res.status(200).send(result);
		}
	});
}
function update_job_applications(req, res) {
	var applied_job_values = _extract_update_applied_job_def(req);
	var applied_job_id = req.params.applied_job_id;

	if (!applied_job_values.employer_id || !applied_job_id) {
		res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
	} else {
		var sql = "UPDATE job_applications SET ? WHERE applied_job_id = ? AND employer_id = ?";
		db.connectAndQuery({ sql: sql, values: [applied_job_values, applied_job_id, req.body.employer_id] }, function (error, results) {
			if (error) {
				console.error("update_job_applications: sql err:", error);
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
function delete_job_applications(req, res) {
	var values = [req.params.applied_job_id, req.body.employer_id];
	var sql = "DELETE FROM job_applications WHERE applied_job_id = ? AND employer_id = ?";
	db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
		if (error) {
			console.error("delete_job_applications: sql err:", error);
			res.sendStatus(500);
		} else if (results.affectedRows < 1) {
			res.sendStatus(404);
		} else {
			res.sendStatus(200);
		}
	});
}
//# sourceMappingURL=applied_jobs.js.map