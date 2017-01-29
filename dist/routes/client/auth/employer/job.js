'use strict';

var _ = require('lodash');
var async = require('async');
var express = require('express');
var db = require('../../../../mysql_db_prod.js');

var router = new express.Router();
exports.router = router;

router.post('/1/job', create_job);
router.post('/1/job/:job_id', update_job);
router.delete('/1/job/:job_id', delete_job);

function _extract_job_def(req) {
	return {
		company_id: req.body.company_id,
		job_role_id: req.body.job_role_id,
		job_type_id: req.body.job_type_id,
		employer_id: req.user.employer_id,
		title: req.body.title,
		location: req.body.location || null,
		pay_rate_min: req.body.pay_rate_min || null,
		pay_rate_max: req.body.pay_rate_max || null,
		min_gpa: req.body.min_gpa || null,
		description: req.body.description || null,
		external_url: req.body.external_url || null,
		posted_at: req.body.posted_at || null,
		takedown_at: req.body.takedown_at || null,
		job_schedule_id: req.body.job_schedule_id || null
	};
}

function create_job(req, res) {
	if (!req.user.employer_id) {
		res.sendStatus(400);
		return;
	}

	var job_values = _extract_job_def(req);

	var connection = void 0;
	var latitude = null;
	var longitude = null;
	var radius_coordinates = {};

	async.series([function (done) {
		db.getConnection(function (error, conn) {
			if (error) {
				console.error("create_job: sql err:", error);
			}
			connection = conn;
			done(error);
		});
	}, function (done) {
		db.queryWithConnection(connection, "START TRANSACTION", [], function (error) {
			if (error) {
				console.error("create_job: sql err:", error);
			}
			done(error);
		});
	}, function (done) {
		if (job_values.location) {
			geocoder.geocode(job_values.location).then(function (res) {
				job_values.location = res[0].formattedAddress;
				latitude = res[0].latitude;
				longitude = res[0].longitude;
				done();
			}).catch(function (err) {
				console.error("create_job: geocoding err:", err);
				done(err);
			});
		} else {
			done();
		}
	}, function (done) {
		_.each(Object.keys(LABEL_TO_RADIUS), function (label) {
			var radius = LABEL_TO_RADIUS[label];
			radius_coordinates[label] = _radius_lat_long_calc(latitude, longitude, radius);
		});
		done();
	}, function (done) {
		var columns = [];
		var values = [];

		_.each(Object.keys(job_values), function (column_name, count) {
			columns.push(column_name);
			values.push(job_values[column_name]);
		});

		// Latitude is the Y axis, longitude is the X axis
		_.each(Object.keys(radius_coordinates), function (label) {
			columns.push('latitude_lower_' + label);
			columns.push('longitude_lower_' + label);
			columns.push('latitude_upper_' + label);
			columns.push('longitude_upper_' + label);

			values.push(radius_coordinates[label][3]);
			values.push(radius_coordinates[label][2]);
			values.push(radius_coordinates[label][1]);
			values.push(radius_coordinates[label][0]);
		});

		columns.push('latitude, longitude');
		values.push(latitude, longitude);

		var sql = "INSERT INTO job (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		db.queryWithConnection(connection, sql, values, function (error, results) {
			if (error) {
				console.error("create_job: sql err:", error);
			}
			done(error, results.insertId);
		});
	}, function (done) {
		db.commit(connection, done);
	}], function (error, result) {
		if (error) {
			db.rollback(connection, function () {});
			console.error("create_job: sql err:", error);
			res.sendStatus(500);
		} else {
			res.status(200).send(result);
		}
	});
}
function update_job(req, res) {
	var job_values = _extract_job_def(req);
	var job_id = req.params.job_id;

	if (!job_values.company_id || !job_values.job_role_id || !job_values.job_type_id) {
		res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
	} else {
		var sql = "UPDATE job SET ? WHERE job_id = ? AND employer_id = ?";
		db.connectAndQuery({ sql: sql, values: [job_values, job_id, req.user.employer_id] }, function (error, results) {
			if (error) {
				console.error("update_job: sql err:", error);
				res.sendStatus(500);
			} else {
				if (results.affectedRows < 1) {
					res.sendStatus(404);
				} else {
					res.status(200).send({ id: job_id });
				}
			}
		});
	}
}
function delete_job(req, res) {
	var values = [req.params.job_id, req.user.employer_id];
	var sql = "DELETE FROM job WHERE job_id = ? AND employer_id = ?";
	db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
		if (error) {
			console.error("delete_job: sql err:", error);
			res.sendStatus(500);
		} else if (results.affectedRows < 1) {
			res.sendStatus(404);
		} else {
			res.sendStatus(200);
		}
	});
}
//# sourceMappingURL=job.js.map