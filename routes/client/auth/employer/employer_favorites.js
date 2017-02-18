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
router.get('/1/employer_favorites', get_employer_favorites);
router.post('/1/employer_favorites', create_employer_favorites);
router.post('/1/employer_favorites/:employer_favorite_id', update_employer_favorites);
router.delete('/1/employer_favorites/:id', delete_employer_favorites);



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
	employer_id: (req.user.employer_id) ? req.user.employer_id : req.body.employer_id,
	employee_id: req.body.employee_id,
	user_id: req.body.user_id,
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
    
    const employer_id = req.query.employer_id;
    const sql = "SELECT company_id, id, employer_favorite_id, employer_id, employee_id, user_id, is_applicant, is_match, date_added " +
	"FROM employer_favorites " +
	"WHERE employer_id  = ?";
    const values = [employer_id];
    
    db.connectAndQuery({sql, values}, (err, results) => {
    	console.log(results)
	if(err) {
	    console.error("get_employer_favorites: sql err:", err);
	    res.sendStatus(500);
	} else if(results.length < 1) {
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
    
    const job_values = _extract_employer_favorite_def(req);
    let connection;
    
    async.series([
	    (done) => {
		db.getConnection((error, conn) => {
		    if (error) {
			console.error("create_employer_favorites: sql err:", error);
		    }
		    connection = conn;
		    done(error);
		});
	    },
	    (done) => {
		
		db.queryWithConnection(connection, "START TRANSACTION", [], (error) => {
		    if (error) {
			console.error("create_employer_favorites: sql err:", error);
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
		
		const sql = "INSERT INTO employer_favorites (" + columns.join(',') + ")" + " VALUES (" + "?,".repeat(values.length).slice(0, -1) + ")";
		db.queryWithConnection(connection, sql, values, (error, results) => {
		    
		    if (error) {
			console.error("create_employer_favorites: sql err:", error);
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
		console.error("create_employer_favorites: sql err:", error);
		res.sendStatus(500);
	    } else {
		res.status(200).send(result);
	    }
	});
}
function update_employer_favorites(req, res) {
    const employer_favorite_values = _extract_update_employer_favorite_def(req);
    const employer_favorite_id = req.params.employer_favorite_id;
    
    if (!employer_favorite_values.employer_id || !employer_favorite_id) {
	res.status(400).send("When updating a job, company, job roles, and job types cannot be created.");
    } else {
	const sql = "UPDATE employer_favorites SET ? WHERE employer_favorite_id = ? AND employer_id = ?";
	db.connectAndQuery({sql, values: [employer_favorite_values, employer_favorite_id, req.body.employer_id]}, (error, results) => {
	    if (error) {
		console.error("update_employer_favorites: sql err:", error);
		res.sendStatus(500);
	    } else {
		if (results.affectedRows < 1) {
		    res.sendStatus(404);
		} else {
		    res.status(200).send({id: employer_favorite_id});
		}
	    }
	});
    }
}
function delete_employer_favorites(req, res) {
    const values = [req.params.id];
    const sql = "DELETE FROM employer_favorites WHERE id = ?";
    db.connectAndQuery({sql, values}, (error, results) => {
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
