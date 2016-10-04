'use strict';

const _ = require('lodash');
const async = require('async');
const industry_util = require('./industry.js');
const db = require('../mysql_db_prod.js');

function create_company(company_def, conn, all_done) {
  let industry_id;
  let company_id;

  if(company_def.id) {
    all_done(null, company_def.id);
  } else {
    async.series([
      (done) => {
        industry_util.create_industry(company_def.industry, conn, (error, result) => {
          if(error) {
            console.error("_create_company: sql err:", error);
          } else {
            industry_id = result;
          }
          done(error);
        });
      },
      (done) => {
        const sql = "SELECT company_id FROM company WHERE name = ?";
        const values = [company_def.name];
        db.queryWithConnection(conn, sql, values, (error, results) => {
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
          const values = [company_def.name, industry_id, company_def.email_domain, JSON.stringify(company_def.property_bag)];
          db.queryWithConnection(conn, sql , values, (error, results) => {
            if(error) {
              console.error("_create_company: sql err:", error);
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
      all_done(error, company_id);
    });
  }
}

exports.create_company = create_company;
