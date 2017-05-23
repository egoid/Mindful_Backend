'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const NodeGeocoder = require('node-geocoder');
const db = require('../../mysql_db_prod.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


const router = new express.Router();
exports.router = router;


router.get('/1/patient', patients);
router.post('/1/patient', create_patient);
router.post('/1/edit_patient', edit_patient);
router.post('/1/delete_patient' , delete_patient);

function create_patient(req,res) {
// Patient_id , doctor_id , username , password , name , email, phone , session_key
  const session_key = req.body.session_key;
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  const phone = req.body.phone;
  const name = req.body.name;

  let connection;
  let user_id;
  let doctor_id;
  let pw_hash;

  async.series([
    (done) => {
      const sql = "START TRANSACTION";
      db.queryAndGetConnection({ sql }, (error, results, c) => {
        if(error) {
          console.error("register: sql err:", error);
        }
        connection = c;
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT user_id FROM sessions WHERE session_key = ? ";
      const values = [session_key];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error('register error', error);
        } else if(results[0] && results[0].user_id) {
          user_id = results[0].user_id
        } else {
          error = "Invalid Key"
        };
        done(error);
      });
    },
    (done) => {
      if (user_id) {
        const sql = "SELECT doctor_id FROM doctors WHERE user_id = ? ";
        const values = [user_id];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error('register error', error);
          } else if(results[0] && results[0].doctor_id) {
            doctor_id = results[0].doctor_id
          } else {
            error = "Quiz creation : Invalid Doctor ID"
          };
          done(error);
        });
      }
    },
    (done) => {

      bcrypt.hash(password, 10, function(err, hash) {
        if(err) {
          console.error("register: bcrypt.hash err:", err);
        }

        pw_hash = hash;
        done(err);
      });

    },
    (done) => {
      if (doctor_id) {
        const sql = "INSERT INTO patients ( doctor_id , username , password , name , email , phone  ) VALUES ( ? , ? , ? , ? , ? , ? ) ";
        const values = [ doctor_id , username , pw_hash , name , email , phone ];        
        console.log(sql , values)
        db.queryWithConnection(connection, sql, values, (error, results) => {
          console.log(results)
          if(error) {
            console.error('Quiz creation :  error', error);
          }
          done(error);
        });
      }
    },
    (done) => {
      db.commit(connection, done);
    }
  ],
  (error) => {
    if(error) {
      db.rollback(connection);
    }

    if(error == 'Patient already exists') {
      res.status(400).send(error);
    } else if(error || !session_key) {
      res.sendStatus(500);
    } else {
      res.status(200).send("OK");
    }
  })
};


function patients(req,res) {
  const session_key = req.query.id

  let connection;
  let user_id;
  let doctor_id;
  let result;

  async.series([
    (done) => {
      const sql = "START TRANSACTION";
      db.queryAndGetConnection({ sql }, (error, results, c) => {
        if(error) {
          console.error("register: sql err:", error);
        }
        connection = c;
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT user_id FROM sessions WHERE session_key = ? ";
      const values = [session_key];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error('register error', error);
        } else if(results[0] && results[0].user_id) {
          user_id = results[0].user_id
        } else {
          error = "Invalid Key"
        };
        done(error);
      });
    },
    (done) => {
      if (user_id) {
        const sql = "SELECT doctor_id FROM doctors WHERE user_id = ? ";
        const values = [user_id];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error('register error', error);
          } else if(results[0] && results[0].doctor_id) {
            doctor_id = results[0].doctor_id
          } else {
            error = "Invalid Doctor ID"
          };
          done(error);
        });
      }
    },
    (done) => {
      if (doctor_id) {
        const sql = "SELECT * FROM patients WHERE doctor_id = ? ";
        const values = [ doctor_id ];        
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error('register error', error);
          } else if(results[0] && results[0].patient_id) {
            result = results
          }
          done(error);
        });
      }
    },
    (done) => {
      db.commit(connection, done);
    }
  ],
  (error) => {
    if(error) {
      db.rollback(connection);
    }

    if(error == 'User already exists') {
      res.status(400).send(error);
    } else if(error || !session_key) {
      res.sendStatus(500);
    } else {
      res.status(200).send(result);
    }
  })

};



function edit_patient(req,res) {
  const session_key = req.body.session_key;
  const title = req.body.title;
  const quiz = req.body.json;
  const quiz_id = req.body.quiz_id;

  let connection;
  let user_id;
  let doctor_id;

  async.series([
    (done) => {
      const sql = "START TRANSACTION";
      db.queryAndGetConnection({ sql }, (error, results, c) => {
        if(error) {
          console.error("register: sql err:", error);
        }
        connection = c;
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT user_id FROM sessions WHERE session_key = ? ";
      const values = [session_key];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error('register error', error);
        } else if(results[0] && results[0].user_id) {
          user_id = results[0].user_id
        } else {
          error = "Invalid Key"
        };
        done(error);
      });
    },
    (done) => {
      if (user_id) {
        const sql = "SELECT doctor_id FROM doctors WHERE user_id = ? ";
        const values = [user_id];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error('register error', error);
          } else if(results[0] && results[0].doctor_id) {
            doctor_id = results[0].doctor_id
          } else {
            error = "Invalid Doctor ID"
          };
          done(error);
        });
      }
    },
    (done) => {
      if (doctor_id) {
        const sql = "UPDATE quizzes SET json = ? , title = ? WHERE quiz_id = ? AND doctor_id = ? ";
        const values = [ quiz , title , quiz_id , doctor_id ];        
        console.log(sql , values)
        db.queryWithConnection(connection, sql, values, (error, results) => {
          console.log(results)
          if(error) {
            console.error('register error', error);
          }
          done(error);
        });
      }
    },
    (done) => {
      db.commit(connection, done);
    }
  ],
  (error) => {
    if(error) {
      db.rollback(connection);
    }

    if(error == 'User already exists') {
      res.status(400).send(error);
    } else if(error || !session_key) {
      res.sendStatus(500);
    } else {
      res.status(200).send("OK");
    }
  })
};


function delete_patient(req,res) {
  const session_key = req.body.session_key;
  const quiz_id = req.body.quiz_id;

  let connection;
  let user_id;

  async.series([
    (done) => {
      const sql = "START TRANSACTION";
      db.queryAndGetConnection({ sql }, (error, results, c) => {
        if(error) {
          console.error("register: sql err:", error);
        }
        connection = c;
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT user_id FROM sessions WHERE session_key = ? ";
      const values = [session_key];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error('register error', error);
        } else if(results[0] && results[0].user_id) {
          user_id = results[0].user_id
        } else {
          error = "Invalid Key"
        };
        done(error);
      });
    },
    (done) => {
      if (quiz_id) {
        const sql = "DELETE FROM quizzes WHERE quiz_id = ? ";
        const values = [ quiz_id ];        
        console.log(sql , values)
        db.queryWithConnection(connection, sql, values, (error, results) => {
          console.log(results)
          if(error) {
            console.error('register error', error);
          }
          done(error);
        });
      }
    },
    (done) => {
      db.commit(connection, done);
    }
  ],
  (error) => {
    if(error) {
      db.rollback(connection);
    }

    if(error == 'User already exists') {
      res.status(400).send(error);
    } else if(error || !session_key) {
      res.sendStatus(500);
    } else {
      res.status(200).send("OK");
    }
  })
};
