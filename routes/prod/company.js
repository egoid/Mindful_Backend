'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');

const db = require('../../mysql_db_prod.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

router.get('/1/company', get_companies);
router.get('/1/company/:company_id', get_company);
router.post('/1/company', create_company);

function _create_industry(industry_def, all_done) {
  if(industry_def.id) {
    all_done(null, industry_def.id);
  } else {
    let industry_id;
    async.series([
      (done) => {
        const sql = "SELECT industry_id FROM industry WHERE industry_type = ?";
        const values = [industry_def.type];
        db.connectAndQuery({sql , values}, (error, results) => {
          if(error) {
            console.error("_create_industry SQL error: " + error);
          } else if(results[0] && results[0].industry_id) {
            industry_id = results[0].industry_id;
          }
          done(error);
        });
      },
      (done) => {
        if(!industry_id) {
          const sql = "INSERT IGNORE INTO industry (industry_name, industry_type) VALUES (?, ?)";
          const values = [industry_def.name, industry_def.type];
          db.connectAndQuery({sql, values}, (error, results) => {
            if(error) {
              console.error("_create_company SQL error: " + error);
              block_err = error;
            } else {
              industry_id = results.insertId;
            }
            done(error);
          });
        } else {
          done();
        }
      },
    ],
    (error) => {
      all_done(error, industry_id);
    });
  }
}

function create_company(req, res) {
  let industry_id;
  let company_id;
  const company_def = req.body;

  async.series([
    (done) => {
      _create_industry(company_def.industry, (error, result) => {
        if(error) {
          console.error(error);
        } else {
          industry_id = result;
        }
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT company_id FROM company WHERE name = ?";
      const values = [company_def.name];
      db.connectAndQuery({sql , values}, (error, results) => {
        if(error) {
          console.error("create_company: sql err: " + error);
        } else if(results[0] && results[0].company_id) {
          company_id = results[0].company_id;
        }
        done(error);
      });
    },
    (done) => {
      if(!company_id) {
        const sql = "INSERT INTO company (name, industry_id, email_domain, property_bag) VALUES (?, ?, ?, ?)";
        const values = [company_def.name, industry_id, company_def.email_domain, JSON.stringify(company_def.property_bag)];
        db.connectAndQuery({sql , values}, (error, results) => {
          if(error) {
            console.error("create_company SQL error: " + error);
          } else {
            company_id = results.insertId;
          }
          done(error);
        });
      } else {
        done();
      }
    }
  ],
  (error) => {
    if(company_id) {
      res.status(200).send(company_id);
    } else {
      res.sendStatus(500);
    }
  });
}
function get_company(req, res) {
  const company_id = req.params.company_id;
  const sql = "SELECT * FROM company WHERE company_id = ?";
  const values = [company_id];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      res.sendStatus(500);
    } else if(results.length < 1) {
      res.sendStatus(404);
    } else {
      res.status(200).send(results[0]);
    }
  });
}
function get_companies(req, res) {
  const sql = "SELECT * FROM company LIMIT 50";
  const values = [];
  const final_results = [];
  db.connectAndQuery({sql, values}, (error, results) => {
    if(error) {
      res.sendStatus(500);
    } else {
      _.each(results, (result) => {
        final_results.push(result);
      });
      res.status(200).send(final_results);
    }
  });
}
