'use strict';

const _ = require('lodash');
const async = require('async');
const mysql = require('mysql');
const config = require('./config.json');

const TIMEOUT_MS = 30*1000;
const DEFAULT_DB_CONF = {
  multipleStatements: true,
  timezone: 'UTC',
  debug: false,
  charset: 'utf8mb4'
};

if(process.env.environment == 'prod') {
  config.mysql_db_prod.host = process.env.RDS_hostname;
  config.mysql_db_prod.password = process.env.RDS_password;
  config.mysql_db_prod.port = process.env.RDS_port;
}

const db_config = Object.assign(DEFAULT_DB_CONF, config.mysql_db_prod);
const db_pool = mysql.createPool(db_config);

function commit(connection, done) {
  queryWithConnection(connection, "COMMIT", [], (error) => {
    try {
      connection.release();
    } catch(e) {
      console.error("Release exception: " + e);
    }
    done(error);
  });
}
function connectAndQuery(opts, callback) {
  queryAndGetConnection(opts, (error, results, connection) => {
    try {
      connection.release();
    } catch(exception) {
      console.error("Release exception: " + exception);
      if(!error) {
        error = "Release exception: " + exception;
      }
    }
    callback(error, results);
  });
}
function getConnection(done) {
  db_pool.getConnection((error, connection) => {
    done(error, connection);
  });
}
function queryWithConnection(connection, sql, values, callback) {
  const opts = {
    sql,
    timeout: TIMEOUT_MS,
  };
  connection.query(opts, values, callback);
}
function queryAndGetConnection(opts, callback) {
  const sql = opts.sql;
  const values = opts.values || [];

  db_pool.getConnection((error, connection) => {
    if(error) {
      callback(error);
    } else {
      queryWithConnection(connection, sql, values, (error, results) => {
        callback(error, results, connection);
      });
    }
  });
}
function rollback(connection, done) {
  queryWithConnection(connection, "ROLLBACK", [], (error) => {
    try {
      connection.release();
    } catch(e) {
      console.error("Release exception: " + e);
      if(!error) {
        error = "Release exception: " + exception;
      }
    }
    done(error);
  });
}

exports.commit = commit;
exports.connectAndQuery = connectAndQuery;
exports.getConnection = getConnection;
exports.queryAndGetConnection = queryAndGetConnection;
exports.queryWithConnection = queryWithConnection;
exports.rollback = rollback;
