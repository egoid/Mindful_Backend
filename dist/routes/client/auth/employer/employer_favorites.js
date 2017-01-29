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
router.get('/1/employer_favorites', get_employer_favorites);
router.post('/1/employer_favorites', create_employer_favorites);
router.post('/1/employer_favorites/:employer_favorite_id', update_employer_favorites);
router.delete('/1/employer_favorites/:employer_favorite_id', delete_employer_favorites);

/**
 * Description:  Applied jobs parameters from the request
 * @param req
 * @returns {{company_id: *, employer_favorite_id: *, employer_favorite_type_id: *, employer_id: *, employee_id: *, status, reviewed_by_id: *}}
 * @private
 */
function _extract_employer_favorite_def(req) {

	return {
		company_id: req.body.company_id,
		employer_favorite_id: req.body.employer_favorite_id,
		employer_id: req.user.employer_id ? req.user.employer_id : req.body.employer_id,
		employee_id: req.body.employee_id,
		user_id: req.user.user_id ? req.user.user_id : req.body.user_id,
		is_applicant: req.body.is_applicant,
		is_match: req.body.is_match
	};
}

function _extract_update_employer_favorite_def(req) {
	return {
		employer_id: req.body.employer_id,
		is_applicant: req.body.is_applicant,
		is_match: req.body.is_match
	};
}

function get_employer_favorites(req, res) {

	var employer_id = req.query.employer_id;
	var sql = "SELECT company_id, employer_favorite_id, employer_id, employee_id, user_id, is_applicant, is_match, date_added " + "FROM employer_favorites " + "WHERE employer_id  = ?";
	var values = [employer_id];

	db.connectAndQuery({ sql: sql, values: values }, function (err, results) {
		if (err) {
			console.error("get_employer_favorites: sql err:", err);
			res.sendStatus(500);
		} else if (results.length < 1) {
			res.sendStatus(404);
		} else {
			res.status(200).send(results);
		}
	});
}

function create_employer_favorites(req, res) {

	if (!req.body.employer_favorite_id && !req.body.employer_id) {
		res.sendStatus(400);
		return;
	}

	var job_values = _extract_employer_favorite_def(req);
	var connection = void 0;

	async.series([function (done) {
		db.getConnection(function (error, conn) {
			if (error) {
				console.error("create_employer_favorites: sql err:", error);
			}
			connection = conn;
			done(error);
		});
	}, function (done) {

		db.queryWithConnection(connection, "START TRANSACTION", [], function (error) {
			if (error) {
				console.error("create_employer_favorites: sql err:", error);
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

		var sql = "INSERT INTO employer_favorites (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		db.queryWithConnection(connection, sql, values, function (error, results) {

			if (error) {
				console.error("create_employer_favorites: sql err:", error);
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
			console.error("create_employer_favorites: sql err:", error);
			res.sendStatus(500);
		} else {
			res.status(200).send(result);
		}
	});
}
function update_employer_favorites(req, res) {
	var employer_favorite_values = _extract_update_employer_favorite_def(req);
	var employer_favorite_id = req.params.employer_favorite_id;

	if (!employer_favorite_values.employer_id || !employer_favorite_id) {
		res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
	} else {
		var sql = "UPDATE employer_favorites SET ? WHERE employer_favorite_id = ? AND employer_id = ?";
		db.connectAndQuery({ sql: sql, values: [employer_favorite_values, employer_favorite_id, req.body.employer_id] }, function (error, results) {
			if (error) {
				console.error("update_employer_favorites: sql err:", error);
				res.sendStatus(500);
			} else {
				if (results.affectedRows < 1) {
					res.sendStatus(404);
				} else {
					res.status(200).send({ id: employer_favorite_id });
				}
			}
		});
	}
}
function delete_employer_favorites(req, res) {
	var values = [req.params.employer_favorite_id, req.body.employer_id];
	var sql = "DELETE FROM employer_favorites WHERE employer_favorite_id = ? AND employer_id = ?";
	db.connectAndQuery({ sql: sql, values: values }, function (error, results) {
		if (error) {
			console.error("delete_employer_favorites: sql err:", error);
			res.sendStatus(500);
		} else if (results.affectedRows < 1) {
			res.sendStatus(404);
		} else {
			res.sendStatus(200);
		}
	});
}
//# sourceMappingURL=employer_favorites.js.map