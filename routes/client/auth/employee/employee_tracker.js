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
router.get('/1/employee_tracker', get_employee_tracker);


/**
 *
 * @param req
 * @param res
 */
function get_employee_tracker(req, res) {
    
    const employee_id = req.query.employee_id;  
    const sql = "(SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'pass' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'favorited' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'contacted' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'contacted_interview_one' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'contacted_interview_two' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +    
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'interviewed' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'background_check' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +  
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'makingoffer' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'hired' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +  
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'pending' ORDER BY first_name, last_name LIMIT 5) " +
  " UNION" +
  " (SELECT * FROM job_applications LEFT JOIN employee ON  job_applications.employee_id = employee.employee_id LEFT JOIN user ON  user.user_id = employee.user_id WHERE job_applications.employee_id = ? and job_applications.status = 'other' ORDER BY first_name, last_name LIMIT 5) ";
    const values = [employee_id, employee_id, employee_id, employee_id, employee_id, employee_id, employee_id, employee_id, employee_id, employee_id, employee_id];
    db.connectAndQuery({sql, values}, (err, results) => {
  if (err) {
      console.error("get_employee_tracker: sql err:", err);
      res.sendStatus(500);
  } else if (results.length < 1) {
      res.sendStatus(404);
  } else {
      res.status(200).send(results);
  }
    });
    
}


