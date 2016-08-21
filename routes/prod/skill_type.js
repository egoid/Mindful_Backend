'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

router.post('/1/skill_type');
router.get('/1/skill_type/:skill_type_id');
router.put('/1/skill_type/:skill_type_id');
router.delete('/1/skill_type/:skill_type_id');

function create_skill_type(req, res) {
  let skill_type_id;
  const name = req.body.name;
  const type = req.body.type;

  async.series([
    (done) => {
      const sql = "SELECT skill_type_id FROM skill_type WHERE skill_type_descr = ?";
      const values = [type];
      db.connectAndQuery({sql, values}, (error, results) => {
        if(error) {
          console.error("create_skill_type: sql err:", error);
        } else if(results.length > 0) {
          skill_type_id = results[0].skill_type_id;
        }
        done(error);
      });
    },
    (done) => {
      if(!skill_type_id) {
        const sql = "INSERT INTO skill_type (skill_type_name, skill_type_descr) VALUES (?,?)";
        const values = [name, type];
        db.connectAndQuery({sql, values}, (error, results) => {
          if(error) {
            console.error("create_skill_type: sql err:", error);
          } else {
            skill_type_id = results.insertId;
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
      res.status(201).send(skill_type_id);
    }
  });
}
function get_skill_type(req, res) {
  const sql = "SELECT * FROM skill_type WHERE skill_type_id = ?";
  const values = [req.params.skill_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_skill_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function update_skill_type(req, res) {
  const name = req.body.name;
  const type = req.body.type;

  const sql = "UPDATE skill_type SET skill_type_name=?, skill_type_descr=? WHERE skill_type_id=?";
  const values = [name, type, req.params.skill_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_skill_type: sql err:", error);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_skill_type(req, res) {
  const sql = "DELETE FROM skill_type WHERE skill_type_id = ?";
  const values = [req.params.skill_type_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_skill_type: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
