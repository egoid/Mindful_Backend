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
router.get('/1/employer_messaging', get_employer_messaging);
router.post('/1/employer_messaging', create_employer_messaging);
router.delete('/1/employer_messaging/:job_application_id', delete_employer_messaging);

/**
 *
 * @param req
 * @returns {{company_id: *, employer_message_id: *, applied_job_type_id: *, employer_id: *, employee_id: *, status: (*|string), reviewed_by_id: *}}
 * @private
 */
function _extract_employer_message_def(req) {
    return {
	from_source_id: req.body.from_source_id, // Todo:// Use Employer ID or User ID
	to_source_id: req.body.to_source_id, // Todo:// Use Employer ID or User ID
	job_application_id: req.body.job_application_id,
	message: req.body.message,
	message_status: req.body.message_status,
	message_date: req.body.message_date,
	message_source: req.body.message_source, //Employer or Applicant Label (User ID)
	request_interview_date: req.body.request_interview_date
    };
}

function get_employer_messaging(req, res) {
    
    const job_application_id = req.query.job_application_id;
    const sql = " SELECT from_source_id, to_source_id, job_application_id, message, message_status, message_date, message_source, request_interview_date " +
	" FROM employer_messaging " +
	" WHERE job_application_id  = ?";
    const values = [job_application_id];
    
    db.connectAndQuery({sql, values}, (err, results) => {
	if (err) {
	    console.error("get_employer_messaging: sql err:", err);
	    res.sendStatus(500);
	} else if (results.length < 1) {
	    res.sendStatus(404);
	} else {
	    res.status(200).send(results);
	}
    });
    
}


function create_employer_messaging(req, res) {
    
    if (!req.body.from_source_id && !req.body.to_source_id) {
	res.sendStatus(400);
	return;
    }
    
    const job_values = _extract_employer_message_def(req);
    let connection;
    
    async.series([
	    (done) => {
		db.getConnection((error, conn) => {
		    if (error) {
			console.error("create_employer_messaging: sql err:", error);
		    }
		    connection = conn;
		    done(error);
		});
	    },
	    (done) => {
		
		db.queryWithConnection(connection, "START TRANSACTION", [], (error) => {
		    if (error) {
			console.error("create_employer_messaging: sql err:", error);
		    }
		    done(error);
		});
	    },
	    (done) => {
		
		const columns = [];
		const values = [];
		
		_.each(Object.keys(job_values), (column_name, count) => {
		    columns.push(column_name);
		    values.push(job_values[column_name]);
		});
		
		const sql = "INSERT INTO employer_messaging (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		console.log(sql);
		
		db.queryWithConnection(connection, sql, values, (error, results) => {
		    
		    if (error) {
			console.error("create_employer_messaging: sql err:", error);
			res.sendStatus(500);
		    } else {
			done(error, results.insertId);
		    }
		});
		
	    },
	    (done) => {
		db.commit(connection, done);
	    },
	],
	(error, result) => {
	    if (error) {
		db.rollback(connection, () => {});
		console.error("create_employer_messaging: sql err:", error);
		res.sendStatus(500);
	    } else {
		res.status(200).send(result);
	    }
	});
}

function delete_employer_messaging(req, res) {
    const values = [req.params.from_source_id, req.body.job_application_id];
    const sql = "DELETE FROM employer_messaging WHERE employer_message_id = ? AND employer_id = ?";
    db.connectAndQuery({sql, values}, (error, results) => {
	if (error) {
	    console.error("delete_employer_messaging: sql err:", error);
	    res.sendStatus(500);
	} else if (results.affectedRows < 1) {
	    res.sendStatus(404);
	} else {
	    res.sendStatus(200);
	}
    });
}
