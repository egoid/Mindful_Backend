'use strict';

const async = require('async');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const express = require('express');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

const USER_TYPES = ['employee', 'employer free', 'employer_paid_1', 'employer_paid_2'];

router.post('/1/user/login',    login);
router.get('/1/user/logout',    logout);
router.post('/1/user/register', register);

function login(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  let user_id;
  let db_pass;
  let session_key;

  async.series([
    (done) => {
      const sql = "SELECT user_id, password FROM user WHERE email = ?";
      const values = [email];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("login error", error);
        } else if(results[0] && results[0].user_id > 0) {
          db_pass = results[0].password;
          user_id = results[0].user_id;
        }  else {
          error = "User cannot be found";
        }
        done(error);
      });
    },
    (done) => {
      bcrypt.compare(password, db_pass, function(error, res) {
        if(error) {
          console.error("login error: ", error);
        } else if(!res) {
          error = "Bad password";
        }
        done(error);
      });
    },
    (done) => {
      const sql = "DELETE FROM user_session WHERE user_id = ?";
      const values = [user_id];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("login: sql error:", error);
        }
        done(error);
      });
    },
    (done) => {
      crypto.randomBytes(24, (error, buffer) => {
        if(error) {
          console.error("login: randomBytes err:", error);
        } else {
          session_key = buffer.toString('base64');
        }
        done(error);
      });
    },
    (done) => {
      const sql = "INSERT INTO user_session (user_session_key, user_id) VALUES (?,?)";
      const values = [session_key, user_id];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("login: sql error:", error);
        }
        done(error);
      });
    }
  ],
  (error) => {
    if(error == 'User cannot be found') {
      res.status(404).send(error);
    } else if(error == "Bad password") {
      res.status(400).send(error);
    } else if(error) {
      res.sendStatus(500);
    } else {
      res.status(200).send(session_key);
    }
  });
}
function register(req, res) {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;
  const user_type = req.body.user_type || 'employee';
  const user_role_id = req.body.user_role_id;

  if(user_type && USER_TYPES.indexOf(user_type) < 0) {
    res.status(400).send('Invalid user type');
  }

  let session_key;
  let pw_hash;
  let user_id;
  let connection;

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
      const sql = "SELECT user_id FROM user WHERE email = ?";
      const values = [email];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error('register error', error);
        } else if(results[0] && results[0].user_id) {
          console.error('register error', "User already exists", results);
          error = "User already exists";
        }
        done(error);
      });
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
      const sql = "INSERT INTO user (first_name, last_name, email, password, user_type, user_role_id) VALUES (?,?,?,?,?,?)";
      const values = [first_name, last_name, email, pw_hash, user_type, user_role_id];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("register: sql err:", error);
        } else {
          user_id = results.insertId;
        }
        done(error);
      });
    },
    (done) => {
      crypto.randomBytes(24, (error, buffer) => {
        if(error) {
          console.error("register: randomBytes err:", error);
        } else {
          session_key = buffer.toString('base64');
        }
        done(error);
      });
    },
    (done) => {
      const sql = "INSERT INTO user_session (user_session_key, user_id) VALUES (?,?)";
      const values = [session_key, user_id];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("register: sql error:", error);
        }
        done(error);
      });
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
      res.status(200).send(session_key);
    }
  })
}
function logout(req, res) {
  const session_key = req.get('X-Yobs-User-Session-Key') || req.cookies.user_session_key;
  const sql = "DELETE FROM user_session WHERE user_session_key = ?";
  const values = [session_key];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("login error", error);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
