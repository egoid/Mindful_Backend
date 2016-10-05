'use strict';

const _ = require('lodash');
const async = require('async');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

const USER_TYPES = ['employee', 'employer free', 'employer_paid_1', 'employer_paid_2'];

router.get('/1/user/current',   get_current);
router.post('/1/user/login',    login);
router.get('/1/user/logout',    login);
router.post('/1/user/register', register);

router.post('/1/user_role', create_user_role);

router.get('/1/user_role/:user_role_id', get_user_role);
router.put('/1/user_role/:user_role_id', update_user_role);
router.delete('/1/user_role/:user_role_id', delete_user_role);

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
    } else if(results.length < 1) {
      res.sendStatus(404);
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
          console.error("register: bcrypt.hash err:", error);
        }

        pw_hash = hash;
        done(err);
      });
    },
    (done) => {
      const sql = "INSERT INTO user (email, password, user_type, user_role_id) VALUES (?,?,?,?)";
      const values = [email, pw_hash, user_type, user_role_id];
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

function create_user_role(req, res) {
  const sql = "INSERT INTO user_role (user_role_name, user_role_descr) VALUES (?,?)";
  const values = [req.body.name, req.body.type];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_user_role: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results.insertId);
    }
  });
}
function get_user_role(req, res) {
  const sql = "SELECT * FROM user_role WHERE user_role_id = ?";
  const values = [req.body.user_role_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_user_role: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function update_user_role(req, res) {
  const arg_map = {
    user_role_descr: req.body.type,
    user_role_name: req.body.name,
  };
  const sql = "UPDATE user_role SET ? WHERE user_role_id = ?";
  const values = [arg_map, req.params.user_role_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_user_role: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 0) {
      res.sendStatus(404);
    } else {
      res.status(200);
    }
  });

}
function delete_user_role(req, res) {
  const sql = "DELETE FROM user_role WHERE user_role_id = ?";
  const values = [req.params.user_role_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_user_role: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 0) {
      res.sendStatus(404);
    } else {
      res.status(200);
    }
  });
}

function create_user_type(req, res) {
  const sql = "INSERT INTO user_type (user_type_name, user_type_descr) VALUES (?,?)";
  const values = [req.body.name, req.body.type];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_user_type: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send(results.insertId);
    }
  });
}
function get_user_type(req, res) {
  const sql = "SELECT * FROM user_type WHERE user_type_id = ?";
  const values = [req.body.user_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_user_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function update_user_type(req, res) {
  const arg_map = {
    user_type_descr: req.body.type,
    user_type_name: req.body.name,
  };
  const sql = "UPDATE user_type SET ? WHERE user_type_id = ?";
  const values = [arg_map, req.params.user_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_user_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 0) {
      res.sendStatus(404);
    } else {
      res.status(200);
    }
  });

}
function delete_user_type(req, res) {
  const sql = "DELETE FROM user_type WHERE user_type_id = ?";
  const values = [req.params.user_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_user_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 0) {
      res.sendStatus(404);
    } else {
      res.status(200);
    }
  });
}
