'use strict';

const _ = require('lodash');
const async = require('async');
const db = require('../mysql_db_prod.js');

function create_industry(industry_def, connection, all_done) {
  if(industry_def && industry_def.id) {
    all_done(null, industry_def.id);
  } else if(industry_def) {
    let industry_id;
    async.series([
      (done) => {
        const sql = "SELECT industry_id FROM industry WHERE industry_type = ?";
        const values = [industry_def.type];
        db.queryWithConnection(connection, sql, values, (error, results) => {
          if(error) {
            console.error("create_industry: sql error: " + error);
          } else if(results[0] && results[0].industry_id) {
            industry_id = results[0].industry_id;
          }
          done(error);
        });
      },
      (done) => {
        if(!industry_id) {
          const sql = "INSERT INTO industry (industry_name, industry_type) VALUES (?, ?)";
          const values = [industry_def.name, industry_def.type];
          db.queryWithConnection(connection, sql, values, (error, results) => {
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
  } else {
    all_done('Bad request');
  }
}

exports.create_industry = create_industry;
