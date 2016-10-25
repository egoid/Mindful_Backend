'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/user_role', create_user_role);
router.post('/1/user_role/:user_role_id', update_user_role);
router.delete('/1/user_role/:user_role_id', delete_user_role);

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
