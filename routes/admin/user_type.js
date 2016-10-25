'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/user_type', create_user_type);
router.post('/1/user_type/:user_role_id', update_user_type);
router.delete('/1/user_type/:user_role_id', delete_user_type);

function create_user_type(req, res) {
  const sql = "INSERT INTO user_type (user_type_name, user_type_descr) VALUES (?,?)";
  const values = [req.body.name, req.body.type];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("create_user_type: sql err:", error);
      res.sendStatus(500);
    } else {
      res.status(200).send({id: results.insertId});
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
