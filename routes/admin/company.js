'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');

const db = require('../../mysql_db_prod.js');

const router = new express.Router();
exports.router = router;

router.post('/1/company', create_company);

function create_company(req, res) {
  let company_id;
  let connection;
  const company_def = req.body;

  async.series([
    (done) => {
      db.getConnection((error, conn) => {
        if(error) {
          console.error(error);
        }
        connection = conn;
        done(error);
      });
    },
    (done) => {
      const sql = "SELECT company_id FROM company WHERE name = ?";
      const values = [company_def.name];
      db.queryWithConnection(connection, sql, values, (error, results) => {
        if(error) {
          console.error("_create_company: sql err:", error);
        } else if(results.length > 0) {
          company_id = results[0].company_id;
        }
        done(error);
      });
    },
    (done) => {
      if(!company_id) {
        const sql = "INSERT INTO company (name, industry_id, email_domain, property_bag) VALUES (?,?,?,?)";
        const values = [company_def.name,
                        company_def.industry_id,
                        company_def.email_domain,
                        JSON.stringify(company_def.property_bag)];

        db.queryWithConnection(connection, sql , values, (error, results) => {
          if(error) {
            console.error("create_company: sql err:", error);
          } else {
            company_id = results.insertId;
          }
          done(error);
        });
      } else {
        done();
      }
    },
    (done) => {
      db.commit(connection, done);
    }
  ],
  (error) => {
    if(error) {
      db.rollback(connection);
      res.status(500);
    } else {
      res.status(200).send({ id: company_id });
    }
  });
}
