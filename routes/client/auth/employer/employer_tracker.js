'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const db = require('../../../../mysql_db_prod.js');

const router = new express.Router();
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
    
    const employer_id = req.query.employer_id;
    console.log(employer_id)
    const sql = "(SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'pass' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'favorited' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'contacted' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'contacted_interview_one' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'contacted_interview_two' ORDER BY first_name, last_name ) " +
	" UNION" +		
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'interviewed' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'background_check' ORDER BY first_name, last_name ) " +
	" UNION" +	
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'makingoffer' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'hired' ORDER BY first_name, last_name ) " +
	" UNION" +	
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'pending' ORDER BY first_name, last_name ) " +
	" UNION" +
	" (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE employer_id = ? and status = 'other' ORDER BY first_name, last_name ) ";
    const values = [employer_id, employer_id, employer_id, employer_id, employer_id, employer_id, employer_id, employer_id, employer_id, employer_id, employer_id];
    db.connectAndQuery({sql, values}, (err, results) => {
    	console.log(results)
	if (err) {
	    console.error("get_employer_tracker: sql err:", err);
	    res.sendStatus(500);
	} else if (results.length < 1) {
	    res.status(200).send([]);
	} else {	
	    res.status(200).send(results);
	}
    });
    
}


