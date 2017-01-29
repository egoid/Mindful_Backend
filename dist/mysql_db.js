'use strict';

var _ = require('lodash');
var async = require('async');
var mysql = require('mysql');
var config = require('./config.json');

var TIMEOUT_MS = 30 * 1000;
var DEFAULT_DB_CONF = {
  multipleStatements: true,
  timezone: 'UTC',
  debug: false,
  charset: 'utf8mb4'
};

if (process.env.environment == 'prod') {
  config.mysql_db_raw.host = process.env.RDS_hostname;
  config.mysql_db_raw.password = process.env.RDS_password;
  config.mysql_db_raw.port = process.env.RDS_port;
}

var db_config = Object.assign(DEFAULT_DB_CONF, config.mysql_db_raw);
var db_pool = mysql.createPool(db_config);

function commit(connection, done) {
  queryWithConnection(connection, "COMMIT", [], function (error) {
    try {
      connection.release();
    } catch (e) {
      console.error("Release exception: " + e);
    }
    done(error);
  });
}
function connectAndQuery(opts, callback) {
  var sql = opts.sql;
  var values = opts.values || [];

  queryAndGetConnection({ sql: sql, values: values }, function (error, results, connection) {
    try {
      connection.release();
    } catch (exception) {
      console.error("Release exception: " + exception);
      if (!error) {
        error = "Release exception: " + exception;
      }
    }
    callback(error, results);
  });
}
function queryWithConnection(connection, sql, values, callback) {
  var opts = {
    sql: sql,
    timeout: TIMEOUT_MS
  };
  connection.query(opts, values, callback);
}
function queryAndGetConnection(opts, callback) {
  var sql = opts.sql;
  var values = opts.values || [];

  db_pool.getConnection(function (error, connection) {
    if (error) {
      callback(error);
    } else {
      queryWithConnection(connection, sql, values, function (error, results) {
        callback(error, results, connection);
      });
    }
  });
}
function rollback(connection, done) {
  queryWithConnection(connection, "ROLLBACK", [], function (error) {
    try {
      connection.release();
    } catch (e) {
      console.error("Release exception: " + e);
      if (!error) {
        error = "Release exception: " + exception;
      }
    }
    done(error);
  });
}

exports.commit = commit;
exports.connectAndQuery = connectAndQuery;
exports.queryAndGetConnection = queryAndGetConnection;
exports.queryWithConnection = queryWithConnection;
exports.rollback = rollback;
//# sourceMappingURL=mysql_db.js.map