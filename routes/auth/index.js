  'use strict';

const async = require('async');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const express = require('express');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;


router.post('/1/login', login);
router.post('/1/logout', logout);
router.post('/1/register', register);
router.post('/1/refresh', refresh);

function register(req, res) {
  const first_name = req.body.first_name
  const last_name = req.body.last_name
  const email = req.body.email
  const password = req.body.password
  const user_type = req.body.user_type || 'doctor';

  let session_key;
  let random_url;
  let api_key;
  let ip_address;
  let browser;
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
      const sql = "SELECT user_id FROM users WHERE email = ?";
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
      const sql = "INSERT INTO users (email, password, user_type ) VALUES (?,?,?)";
      const values = [ email, pw_hash, user_type ];
      console.log(sql , values)
      db.queryWithConnection(connection, sql, values, (error, results) => {
        console.log(results)
        if(error) {
          console.error("register: sql err:", error);
        } else {
          user_id = results.insertId;
        }
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT * FROM sessions WHERE user_id = ?";
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
      crypto.randomBytes(24, (error, buffer) => {
        if(error) {
          console.error("register: randomBytes err:", error);
        } else {
          api_key = buffer.toString('base64');
        }
        done(error);
      });
    },
    (done) => {
      if (user_type === 'doctor') {
        let test = Number(Math.random() * (999 - 1) + 1).toFixed(0)
        random_url = first_name.slice(0,3) + last_name.slice(0,2) + test
        const sql = "INSERT INTO doctors (user_id , first_name, last_name , session_key , url ) VALUES (?,?,?,?,?)";
        const values = [user_id , first_name, last_name , session_key , random_url ];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error("register: sql err:", error);
          }
          done(error);
        });
        
      }
    },
    (done) => {
      var ua = req.headers['user-agent'],
      $ = {};

      if (/mobile/i.test(ua))
          $.Mobile = true;

      if (/like Mac OS X/.test(ua)) {
          $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
          $.iPhone = /iPhone/.test(ua);
          $.iPad = /iPad/.test(ua);
      }

      if (/Android/.test(ua))
          $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

      if (/webOS\//.test(ua))
          $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

      if (/(Intel|PPC) Mac OS X/.test(ua))
          $.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;

      if (/Windows NT/.test(ua))
          $.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

      browser = JSON.stringify($)
      ip_address = req.ip
    
      const sql = "INSERT INTO sessions (user_id, session_key , api_key , ip_address , browser ) VALUES (?,?,?,?,?)";
      const values = [ user_id, session_key , api_key , ip_address , browser ];
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
      res.status(200).send([ session_key , api_key , null , random_url ]);
    }
  })
}
function login(req, res) {
  const email = req.body.email;
  const password = req.body.password;


  let connection;
  let user_id;
  let url;
  let db_pass;
  let session_key;
  let session;
  let api_key;
  let browser;
  let ip_address;
  let match;


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
      const sql = "SELECT users.user_id, users.password , doctors.url FROM users INNER JOIN doctors ON users.user_id=doctors.user_id WHERE users.email = ? ";
      const values = [email];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("login error", error);
        } else if(results[0] && results[0].user_id > 0) {
          db_pass = results[0].password;
          user_id = results[0].user_id;
          url = results[0].url;
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
      crypto.randomBytes(24, (error, buffer) => {
        if(error) {
          console.error("register: randomBytes err:", error);
        } else {
          api_key = buffer.toString('base64');
        }
        done(error);
      });
    },
    (done) => {
      let sql = "UPDATE doctors set session_key = ? where user_id = ?"
      const values = [ session_key , user_id ]

      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.log(error)
          // res.sendStatus(500) 
        } 
        done(error);
      });
    },
    (done) => {
      var ua = req.headers['user-agent'],
      $ = {};

      if (/mobile/i.test(ua))
          $.Mobile = true;

      if (/like Mac OS X/.test(ua)) {
          $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
          $.iPhone = /iPhone/.test(ua);
          $.iPad = /iPad/.test(ua);
      }

      if (/Android/.test(ua))
          $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

      if (/webOS\//.test(ua))
          $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

      if (/(Intel|PPC) Mac OS X/.test(ua))
          $.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;

      if (/Windows NT/.test(ua))
          $.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

      browser = JSON.stringify($)
      ip_address = req.ip

      const sql = "SELECT browser, ip_address FROM sessions WHERE user_id = ?";
      const values = [user_id];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("login error", error);
        } else if(results[0] && results[0].browser && results[0].ip_address) {
          match = "exists"
          if (results[0].browser !== browser && results[0].ip_address !== ip_address ) {
            match = "unmatching"
          }
        }
        done(error);
      });
    },
    (done) => {
      if (match === "exists") {      
        const sql = "UPDATE sessions set api_key = ?, session_key = ? , browser = ? , ip_address = ? where user_id = ?"
        const values = [ api_key , session_key , browser , ip_address , user_id ]

        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.log(error)
            // res.sendStatus(500) 
          } 
          done(error);
        });
      } else {
        const sql = "INSERT INTO sessions (user_id, session_key , api_key , ip_address , browser ) VALUES (?,?,?,?,?)";
        const values = [ user_id, session_key , api_key , ip_address , browser ];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error("register: sql error:", error);
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
    if(error == 'User cannot be found') {
      res.status(404).send(error);
    } else if(error == "Bad password") {
      res.status(400).send(error);
    } else if(error) {
      res.sendStatus(500);
    } else {
      res.status(200).send([ session_key , api_key , match , url ]);
    }
  });
};

function logout(req, res) {
  const session_key = req.body.session_key

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
          console.error("login error", error);
        } else {
          user_id = results[0].user_id
        }
        done(error);
      });
    },
    (done) => {
      const sql = "DELETE FROM sessions WHERE session_key = ? ";
      const values = [session_key];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("login error", error);
        }
        done(error);
      });
    },
    (done) => {
      if (user_id) {

        const sql = "UPDATE doctors set session_key = ? where user_id = ?"
        const values = [ null , null , user_id];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error("login error", error);
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
    if(error == 'Logout Failed') {
      res.status(404).send(error);
    } else {
      res.status(200).send("OK");
    }
  });
};

function refresh(req, res) {
  const session_key = req.body.session_key
  const sql = "SELECT api_key FROM sessions WHERE session_key = ?";
  const values = [session_key];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("login error", error);
      res.sendStatus(500);
    } else if(results[0] && results[0].api_key) {
      res.status(200).send(results[0].api_key);
    } else {
      res.sendStatus(500);
    }
  });
};
