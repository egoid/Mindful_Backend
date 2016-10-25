'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/shift_type', create_shift_type);
router.post('/1/shift_type/:shift_type_id', update_shift_type);
router.delete('/1/shift_type/:shift_type_id', delete_shift_type);

function create_shift_type(req, res) {
  let shift_type_id;
  const name = req.body.name;
  const type = req.body.type;

  async.series([
    (done) => {
      const sql = "SELECT shift_type_id FROM shift_type WHERE shift_type_descr = ?";
      const values = [type];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("create_shift_type: sql err:", error);
        } else if(results.length > 0) {
          shift_type_id = results[0].shift_type_id;
        }
        done(error);
      });
    },
    (done) => {
      if(!shift_type_id) {
        const sql = "INSERT INTO shift_type (shift_type_name, shift_type_descr) VALUES (?,?)";
        const values = [name, type];
        db.connectAndQuery({sql, values}, (error, results) => {
          if(error) {
            console.error("create_shift_type: sql err:", error);
          } else {
            shift_type_id = results.insertId;
          }
          done(error);
        });
      } else {
        done();
      }
    }
  ],
  (error) => {
    if(error) {
      res.sendStatus(500);
    } else {
      res.status(200).send(shift_type_id);
    }
  });
}
function update_shift_type(req, res) {
  const sql = "UPDATE shift_type SET shift_type_name=?, shift_type_descr=? WHERE shift_type_id=?";
  const values = [req.body.name, req.body.type, req.params.shift_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_shift_type: sql err:", error);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_shift_type(req, res) {
  const sql = "DELETE FROM shift_type WHERE shift_type_id = ?";
  const values = [req.params.shift_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_shift_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
