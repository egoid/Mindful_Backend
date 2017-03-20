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
router.get('/1/job_applications', get_job_applications);
router.post('/1/job_applications', create_job_applications);
router.post('/1/job_applications/:applied_job_id', update_job_applications);
router.delete('/1/job_applications/:applied_job_id/:employee_id', delete_job_applications);

/**
 *
 * @param req
 * @returns {{company_id: *, applied_job_id: *, applied_job_type_id: *, employer_id: *, employee_id: *, status, reviewed_by_id: *}}
 * @private
 */
function _extract_applied_job_def(req) {
    
    return {
	company_id: req.body.company_id,
	applied_job_id: req.body.applied_job_id,
	applied_job_type_id: req.body.applied_job_type_id,
	employer_id: (req.user.employer_id) ? req.user.employer_id : req.body.employer_id,
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
    
    const employer_id = req.query.employer_id;
    const sql = "SELECT company_id, applied_job_id, applied_job_type_id, employer_id, employee_id,status, reviewed_by_id, added_date, status " +
	"FROM job_applications " +
	"WHERE employer_id  = ?";
    const values = [employer_id];
    
    db.connectAndQuery({sql, values}, (err, results) => {
	if (err) {
	    console.error("get_job_applications: sql err:", err);
	    res.sendStatus(500);
	} else if (results.length < 1) {
	    // res.sendStatus(404);
	    res.status(200).send([]);
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
    
    const job_values = _extract_applied_job_def(req);
    let connection;
    
    async.series([
	    (done) => {
		db.getConnection((error, conn) => {
		    if (error) {
			console.error("create_job_applications: sql err:", error);
		    }
		    connection = conn;
		    done(error);
		});
	    },
	    (done) => {
		
		db.queryWithConnection(connection, "START TRANSACTION", [], (error) => {
		    if (error) {
			console.error("create_job_applications: sql err:", error);
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
		
		const sql = "INSERT INTO job_applications (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		db.queryWithConnection(connection, sql, values, (error, results) => {
		    
		    if (error) {
			console.error("create_job_applications: sql err:", error);
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
		console.error("create_job_applications: sql err:", error);
		res.sendStatus(500);
	    } else {
		res.status(200).send(result);
	    }
	});
}
function update_job_applications(req, res) {
    const applied_job_values = _extract_update_applied_job_def(req);
    const applied_job_id = req.params.applied_job_id;
    if (!applied_job_values.employer_id || !applied_job_id) {
	res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
    } else {
	const sql = "UPDATE job_applications SET ? WHERE applied_job_id = ? AND employer_id = ? AND employee_id = ? ";
	db.connectAndQuery({sql, values: [applied_job_values, applied_job_id, req.body.employer_id , req.body.employee_id ]}, (error, results) => {
	    if (error) {
		console.error("update_job_applications: sql err:", error);
		res.sendStatus(500);
	    } else {
		if (results.affectedRows < 1) {
		    res.sendStatus(404);
		} else {
		    res.status(200).send({id: applied_job_id});
		}
	    }
	});
 	}   
}
function delete_job_applications(req, res) {
    const values = [req.params.applied_job_id, req.params.employee_id];
    const sql = "DELETE FROM job_applications WHERE applied_job_id = ? AND employee_id = ?";
    db.connectAndQuery({sql, values}, (error, results) => {
	if (error) {
	    console.error("delete_job_applications: sql err:", error);
	    res.sendStatus(500);
	} else {
	    res.sendStatus(200);
	}
    });
}
