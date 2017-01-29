'use strict';

var _ = require('lodash');
var async = require('async');
var express = require('express');
var NodeGeocoder = require('node-geocoder');
var db = require('../../../../mysql_db_prod.js');

var router = new express.Router();
exports.router = router;

var GOOGLE_GEO_CONFIG = {
    apiKey: 'AIzaSyAJwf4JXpI9MRGuZdYcOFT9-nq5lzbuPKI',
    formatter: null,
    httpAdapter: 'https',
    provider: 'google'
};
var geocoder = NodeGeocoder(GOOGLE_GEO_CONFIG);

router.get('/1/employee', get_employee);
router.get('/1/employees_not_applied_jobs', get_employees_have_not_applied_to_jobs);
router.post('/1/employee', create_employee);
router.put('/1/employee', update_employee);

/**** EMPLOYEE ENDPOINTS ****/
function get_employee(req, res) {
    var sql = "SELECT *" + "FROM employee " + "JOIN user USING(user_id) " + "WHERE employee_id=?";
    var values = [req.query.employee_id];
    
    db.connectAndQuery({sql: sql, values: values}, function (error, results) {
	if (error) {
	    console.error("get_employee: sql err:", error);
	    res.sendStatus(500);
	} else if (results.length < 1) {
	    res.sendStatus(404);
	} else {
	    res.status(200).send(results[0]);
	}
    });
}
function create_employee(req, res) {
    var user_id = req.user.user_id;
    if (!user_id) {
	res.status(400).send('User ID required');
    } else {
	(function () {
	    var school_id = req.body.school_id || null;
	    var location_name = req.body.location_name || null;
	    var transportation = req.body.transportation || null;
	    var tipi_score_id = req.body.tipi_score_id || null;
	    var headline = req.body.headline || null;
	    var school_level = req.body.school_level || null;
	    var gpa = req.body.gpa || null;
	    var schedule_id = req.body.schedule_id || null;
	    
	    var search_formatted = void 0;
	    var search_lat = void 0;
	    var search_long = void 0;
	    var employee_id = void 0;
	    
	    async.series([function (done) {
		if (location_name) {
		    geocoder.geocode(location_name).then(function (res) {
			search_formatted = res[0].formattedAddress;
			search_lat = res[0].latitude;
			search_long = res[0].longitude;
			done();
		    }).catch(function (err) {
			console.error("create_employee: geocoder err:", err);
			done(err);
		    });
		} else {
		    done();
		}
	    }, function (done) {
		var sql = "INSERT INTO employee " + "(user_id, school_id, location_name, location_latitude, " + "location_longitude, transportation, tipi_score_id, " + "headline, school_level, gpa, schedule_id) " + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		
		var values = [user_id, school_id, search_formatted, search_lat, search_long, transportation, tipi_score_id, headline, school_level, gpa, schedule_id];
		
		db.connectAndQuery({sql: sql, values: values}, function (error, results) {
		    if (error) {
			console.error("create_employee: sql err:", error);
		    } else {
			employee_id = results.insertId;
		    }
		    
		    done(error);
		});
	    }], function (error) {
		if (error) {
		    res.sendStatus(500);
		} else {
		    res.status(200).send({id: employee_id});
		}
	    });
	})();
    }
}

function get_employees_have_not_applied_to_jobs(req, res) {
    
    var employee_id = req.query.employee_id;
    var sql = "SELECT company_id, applied_job_id, applied_job_type_id, employer_id, employee_id,status, reviewed_by_id, added_date " + "FROM applied_jobs " + "WHERE employer_id  = ?";
    var values = [employee_id];
    
    db.connectAndQuery({sql: sql, values: values}, function (err, results) {
	if (err) {
	    console.error("get_applied_jobs: sql err:", err);
	    res.sendStatus(500);
	} else if (results.length < 1) {
	    res.sendStatus(404);
	} else {
	    res.status(200).send(results);
	}
    });
}

function update_employee(req, res) {
    var employee_id = req.user.employee_id;
    
    var location_name = req.body.location_name || null;
    var UPDATABLE_COLS = ['school_id', 'transportation', 'tipi_score_id', 'headline', 'school_level', 'gpa', 'schedule_id'];
    
    var search_formatted = void 0;
    var search_lat = void 0;
    var search_long = void 0;
    
    var update_values = {};
    
    async.series([function (done) {
	if (location_name) {
	    geocoder.geocode(location_name).then(function (res) {
		update_values.location_name = res[0].formattedAddress;
		update_values.location_latitude = res[0].latitude;
		update_values.location_longitude = res[0].longitude;
		done();
	    }).catch(function (err) {
		console.error("update_employee: geocoding err:", err);
		done(err);
	    });
	} else {
	    done();
	}
    }, function (done) {
	_.each(UPDATABLE_COLS, function (col) {
	    if (req.body[col]) {
		update_values[col] = req.body[col];
	    }
	});
	
	var sql = "UPDATE employee SET ? WHERE employee_id = ?";
	var values = [update_values, employee_id];
	db.connectAndQuery({sql: sql, values: values}, function (error, results) {
	    if (error) {
		console.error("update_employee: sql err:", error);
	    }
	    done(error);
	});
    }], function (error) {
	if (error) {
	    res.sendStatus(500);
	} else {
	    res.sendStatus(200);
	}
    });
}
//# sourceMappingURL=employee.js.map