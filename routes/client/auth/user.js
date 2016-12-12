'use strict';

const async = require('async');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/user', update_user);
router.post('/1/user/verify', verify_user);

router.get('/1/user/verify_email', send_verify_email);
router.get('/1/user/current', get_current);

function get_current(req, res) {
  const user = req.user;
  res.send({ user });
}
function update_user(req, res) {
  const user = req.user;
  const verified = req.body.verified;
  const password = req.body.password;
  const update_values = { verified }

  async.series([
    (done) => {
      if(password) {
        bcrypt.hash(password, 10, function(err, hash) {
          if(err) {
            console.error("update_user: bcrypt.hash err:", error);
          }
          update_values.password = hash;
          done(err);
        });
      } else {
        done();
      }
    },
    (done) => {
      const sql = "UPDATE user SET ? WHERE user_id = ?";
      const values = [update_values, user.user_id];

      db.connectAndQuery({sql, values}, (err, results) => {
        if(err) {
          console.error("update_user: sql err:", err);
        } else if(results.affectedRows < 1) {
          err = '404';
        }

        done(err);
      });
    }
  ],
  (err) => {
    if(err && err != '404') {
      res.status(500);
    } else if(err == '404') {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function verify_user(req, res) {
  const user = req.user;
  const verify_key = req.body.verify_key;
  let result_verify_key;

  async.series([
    (done) => {
      const sql = "SELECT verify_key FROM user_verify WHERE user_id = ?";
      const values = [user.user_id];
      db.connectAndQuery({sql, values}, (err, result) => {
        if(err) {
          console.log(err);
        } else if(result.length > 0) {
          result_verify_key = result.verify_key;
        }
        done(err);
      });
    },
    (done) => {
      if(verify_key && result_verify_key && result_verify_key == verify_key) {
        const sql = "UPDATE user SET verified = 1 WHERE user_id = ?";
        const values = [user.user_id];
        db.connectAndQuery({sql, values}, (err, result) => {
          if(err) {
            console.error(err);
          } else if(result.affectedRows < 1) {
            err = '404';
          }
          done(err);
        });
      } else {
        done('404');
      }
    }
  ],
  (err) => {
    if(err == '404') {
      res.sendStatus(404);
    } else if(err) {
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}

function send_verify_email(req, res) {
  let verify_key;
  const transporter = nodemailer.createTransport('smtps://admin%40yobs.io:Password@smtp.zoho.com');

  async.series([
    (done) => {
      crypto.randomBytes(24, (error, buffer) => {
        if(error) {
          console.error("login: randomBytes err:", error);
        } else {
          verify_key = buffer.toString('base64');
        }
        done(error);
      });
    },
    (done) => {
      const sql = "DELETE FROM user_verify WHERE user_id = ?;" +
                  "INSERT INTO user_verify (verify_key, user_id) VALUES (?, ?)";
      const values = [req.user.user_id, verify_key, req.user.user_id];
      db.connectAndQuery({sql, values}, (err, result) => {
        if(err) {
          console.error(err);
        }
        done(err);
      });
    },
    (done) => {
      const verify_link = 'https://yobs.io/verify/' + verify_key;
      const text_email = 'Please go here: ' + verify_link;
      const html_email = 'Click to verify your email: <a href="' + verify_link + '">verify</a>';

      // setup e-mail data with unicode symbols
      const mailOptions = {
          from: '"Yobs" <admin@yobs.io>',
          to: req.user.email,
          subject: 'Please verify your email for Yobs',
          text: text_email,
          html: html_email
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if(err){
          console.log(err);
        }
        done(err)
      });
    }
  ],
  (err) => {
    if(err) {
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
}
