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
router.get('/1/employer_tracker', get_employer_tracker);

/**
 *
 * @param req
 * @param res
 */
function get_employer_tracker(req, res) {

	var employer_id = req.query.employer_id;
	var sql = "(SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'pass' ORDER BY first_name, last_name LIMIT 5) " + " UNION" + " (SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'favorited' ORDER BY first_name, last_name LIMIT 5) " + " UNION" + " (SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'contacted' ORDER BY first_name, last_name LIMIT 5) " + " UNION" + " (SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'interviewed' ORDER BY first_name, last_name LIMIT 5) " + " UNION" + " (SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'makingoffer' ORDER BY first_name, last_name LIMIT 5) " + " UNION" + " (SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'pending' ORDER BY first_name, last_name LIMIT 5) " + " UNION" + " (SELECT * FROM yobs_tech_admin_tool_v2.job_applications LEFT JOIN yobs_tech_admin_tool_v2.employee ON  yobs_tech_admin_tool_v2.job_applications.employee_id = yobs_tech_admin_tool_v2.employee.employee_id LEFT JOIN yobs_tech_admin_tool_v2.user ON  yobs_tech_admin_tool_v2.user.user_id = yobs_tech_admin_tool_v2.employee.user_id WHERE employer_id = ? and status = 'other' ORDER BY first_name, last_name LIMIT 5) ";
	var values = [employer_id, employer_id, employer_id, employer_id, employer_id, employer_id, employer_id];
	db.connectAndQuery({ sql: sql, values: values }, function (err, results) {
		if (err) {
			console.error("get_employer_tracker: sql err:", err);
			res.sendStatus(500);
		} else if (results.length < 1) {
			res.sendStatus(404);
		} else {
			res.status(200).send(results);
		}
	});
}
//# sourceMappingURL=employer_tracker.js.map