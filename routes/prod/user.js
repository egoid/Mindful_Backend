'use strict';

const async = require('async');
const bcrypt = require('bcrypt');
const express = require('express');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/user', update_user);
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
