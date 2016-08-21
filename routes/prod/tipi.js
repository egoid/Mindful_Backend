'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

router.post('/1/tipi', create_tipi);
router.get('/1/tipi/:tipi_id', get_tipi);
router.put('/1/tipi/:tipi_id', update_tipi);
router.delete('/1/tipi/:tipi_id', delete_tipi);

function create_tipi(req, res) {
  const employee_id = req.body.employee_id;

  if(!employee_id) {
    res.sendStatus(400);
  } else {
    const extraversion = req.body.extraversion || 0;
    const agreeableness = req.body.agreeableness || 0;
    const conscientiousness = req.body.conscientiousness || 0;
    const emotional_stability = req.body.emotional_stability || 0;
    const openness_to_experiences = req.body.openness_to_experiences || 0;

    const sql = "INSERT INTO tipi_score " +
    "(employee_id, extraversion, agreeableness, conscientiousness, " +
    " emotional_stability, openness_to_experiences) VALUES (?)";
    const values = [employee_id, extraversion, agreeableness, conscientiousness,
                    emotional_stability, openness_to_experiences];
    db.connectAndQuery({sql, values}, (error, results) => {
      if(error) {
        console.error("create_tipi: sql err:", error);
        res.sendStatus(500);
      } else {
        res.status(201).send(results.insertId);
      }
    });
  }
}
function get_tipi(req, res) {
  const sql = "SELECT * FROM tipi_score WHERE tipi_score_id = ?";
  const values = [req.params.tipi_score_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("get_tipi: sql err:", error);
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function update_tipi(req, res) {
  const extraversion = req.body.extraversion || 0;
  const agreeableness = req.body.agreeableness || 0;
  const conscientiousness = req.body.conscientiousness || 0;
  const emotional_stability = req.body.emotional_stability || 0;
  const openness_to_experiences = req.body.openness_to_experiences || 0;

  const sql = "UPDATE tipi_score " +
  "extraversion=?, agreeableness=?, conscientiousness=?, " +
  " emotional_stability=?, openness_to_experiences =? WHERE tipi_score_id=?";
  const values = [extraversion, agreeableness, conscientiousness,
                  emotional_stability, openness_to_experiences,
                  req.params.tipi_score_id];

  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("update_tipi: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
function delete_tipi(req, res) {
  const sql = "DELETE FROM tipi_score WHERE tipi_score_id=?";
  const values = [req.params.tipi_score_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      console.error("delete_tipi: sql err:", error);
      res.sendStatus(500);
    } else if(results.affectedRows < 1) {
      res.sendStatus(404);
    } else {
      res.sendStatus(200);
    }
  });
}
