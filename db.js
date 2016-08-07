var _ = require('lodash');
var async = require('async');
var pg = require('pg');

var config = require('./config.json');

var db_config = config.pg_db;
db_config.multipleStatements = true;
db_config.timezone = 'UTC';
db_config.debug = false;
db_config.charset = 'utf8mb4';

var PG_TIMEOUT_MS = 30*1000;

var db_pool = new pg.Pool(db_config);

exports.db_pool = db_pool;
exports.connectionFromPool = connectionFromPool;
exports.queryWithArgMapFromPool = queryWithArgMapFromPool;
exports.queryWithArgMap = queryWithArgMap;
exports.queryFromPool = queryFromPool;
exports.queryFromPoolWithConnection = queryFromPoolWithConnection;
exports.rollback = rollback;
exports.commit = commit;
exports.query = query;
exports.lockedFunction = lockedFunction;

function connectionFromPool(callback) {
  db_pool.connect((error, connection, done_with_connection) => {
    if(error) {
      callback(error);
    } else {
      callback(null, connection, done_with_connection);
    }
  });
}
function queryWithArgMapFromPool(sql,arg_values,callback) {
  connectionFromPool((error, connection, release) => {
    if(error) {
      callback(error);
    } else {
      queryWithArgMap(connection, sql, arg_values, (err,results) => {
        try {
          release();
        } catch(e) {
          console.error("Release exception: " + e);
        }
        callback(err, results);
      });
    }
  });
}
function queryWithArgMap(connection,opts,arg_values,callback) {
  if(typeof opts != 'object') {
    opts = { sql: opts, };
  }

  var needle_list = _.map(arg_values,function(val,key){ return ":" + key });
  var regex = new RegExp(needle_list.join("|"),'g');
  var match_list = opts.sql.match(regex);
  var values = _.map(match_list,function(val) {
    var key = val.slice(1);
    return arg_values[key];
  });
  opts.sql = opts.sql.replace(regex,"?");
  if(db_config.debug) {
    console.log("queryWithArgMap sql:",opts.sql);
  }

  query(connection, opts, values, callback);
}
function queryFromPool(sql, values, callback) {
  if(typeof values === 'function') {
    callback = values;
    values = [];
  }

  queryFromPoolWithConnection(sql, values, (error, results, connection, release) => {
    try {
      release();
    } catch(e) {
      console.error("Release exception: " + e);
    }

    callback(error, results);
  });
}
function queryFromPoolWithConnection(sql, values, callback) {
  if(typeof values === 'function') {
    callback = values;
    values = [];
  }

  db_pool.connect((error, connection, release) => {
    if(error) {
      callback(error);
    } else {
      query(connection, sql, values, (error, results) => {
        callback(error, results, connection);
      });
    }
  });
}
function rollback(connection, done, release) {
  if(!done) {
    done = function() {};
  }

  if(connection) {
    query(connection, "ROLLBACK", [], (error,results) => {
      try {
        release();
      } catch(e) {
        console.error("Release exception: " + e);
      }
      done(error);
    });
  } else {
    done();
  }
}
function commit(connection, done, release) {
  if(!done) {
    done = function() {};
  }
  if(connection) {
    query(connection, "COMMIT", [], (err, results) => {
      try {
        release();
      } catch(e) {
        console.error("Release exception: " + e);
      }
      done(err);
    });
  } else {
    done();
  }
}
function query(connection, opts, values, callback) {
  if(typeof values === 'function') {
    callback = values;
    values = [];
  }
  if(typeof opts != 'object') {
    opts = { sql: opts, };
  }

  if(!opts.timeout) {
    opts.timeout = PG_TIMEOUT_MS;
  }

  connection.query(opts, values, callback);
}
function lockedFunction(lock_name, func, all_done) {
  var connection = false;
  var release_func = false;

  async.series([
    (done) => {
      var sql = "SELECT GET_LOCK(?,0) AS lock_result";
      queryFromPoolWithConnection(sql, lock_name, (error, results, new_conn, release) => {
        connection = new_conn;
        release_func = release;
        if(!error) {
          if(results.length == 0) {
            error = 'lock_failed'
          } else if( results[0].lock_result == 0 ) {
            error = 'lock_contend';
          } else if( results[0].lock_result != 1 ) {
            error = 'lock_failed';
          }
        }
        done(err);
      });
    },
    (done) => {
      func(done);
    }],
    (err, results) => {
      if(connection) {
        query(connection, "SELECT RELEASE_LOCK(?)", lock_name, () => {
          release_func();
          all_done(err);
        });
      }
    }
  );
}
