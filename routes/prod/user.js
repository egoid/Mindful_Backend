'use strict';

const _ = require('lodash');
const async = require('async');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('node-config-sets');
const ejs = require('ejs');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

router.get('/1/user/current',   get_current);
router.post('/1/user/login',    login);
router.post('/1/user/register', register);

function get_current(req, res) {
  const session_key = req.get('X-Yobs-User-Session-Key') || req.cookies.user_session_key;
  const sql = "SELECT user.* " +
              "FROM user " +
              "JOIN user_session USING(user_id) " +
              "WHERE user_session_key = ?";
  const values = [session_key];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_current error", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
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
        } else if(results[0].user_id > 0) {
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
          console.error("login error: compare failed");
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
          console.error("login error", error);
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
      const sql = "INSERT INTO user_session (user_session_key, user_id) VALUES (?, ?)";
      const values = [session_key, user_id];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("register error", error);
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
    }
    res.status(200).send(session_key);
  });
}
function register(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  let session_key;
  let pw_hash;
  let user_id;

  async.series([
    (done) => {
      const sql = "SELECT user_id FROM user WHERE email = ?";
      const values = [email];
      db.connectAndQuery({sql, values}, (error, results) => {
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
        pw_hash = hash;
        done(err);
      });
    },
    (done) => {
      const sql = "INSERT INTO user (email, password) VALUES (?, ?)";
      const values = [email, pw_hash];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("register error", error);
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
      const sql = "INSERT INTO user_session (user_session_key, user_id) VALUES (?, ?)";
      const values = [session_key, user_id];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("register error", error);
        }
        done(error);
      });
    }
  ],
  (error) => {
    if(error == 'User already exists') {
      res.status(400).send(error);
    } else if(error || !session_key) {
      res.sendStatus(500);
    }
    res.status(200).send(session_key);
  })
}
