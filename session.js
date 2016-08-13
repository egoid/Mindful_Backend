'use strict';

const async = require('async');
const crypto = require('crypto');
const db = require('./mysql_db_prod.js');
const util = require('./util.js');

const SESSION_COOKIE_MAX_AGE = 30*24*60*60*1000;
const MAX_SESSION_AGE_MS = 15*60*1000;

exports.SESSION_COOKIE_MAX_AGE = SESSION_COOKIE_MAX_AGE;
exports.addSession = addSession;
exports.requireValidSession = requireValidSession;
exports.requireEmployerSession = requireEmployerSession;
exports.createSession = createSession;
exports.removeAllSessions = removeAllSessions;

const g_session_cache = {};

function _get_db_session(session_key, done) {
  const sql = "SELECT yobs_user_session.*, yobs_user.email, yobs_user.is_admin, yobs_user.first_name, yobs_user.last_name "
            + " FROM yobs_user_session "
            + " JOIN yobs_user USING (user_id) "
            + " WHERE user_session_key = ? AND yobs_user.is_deleted = 0 ";

  db.queryFromPool(sql, [session_key], (error, results) => {
    var user_session = false;
    if(error) {
      util.errorLog("get_db_session: sql err:", error)
    } else if(results.length > 0) {
      user_session = results[0];
    } else {
      error = 'not_found';
    }
    done(error, user_session);
  });
}
function _validate_sesson_key(session_key) {
  var user_session = false;
  if(session_key in g_session_cache) {
    var cache_entry = g_session_cache[session_key];
    var age = Date.now() - cache_entry.create_ts;
    if(age > MAX_SESSION_AGE_MS) {
      delete g_session_cache[session_key];
    } else {
      user_session = cache_entry.session;
    }
  }
  return user_session;
}

function addSession(req,res,next) {
  if('user_session_key' in req.query) {
    throw { code: 400, body: "session_key not allowed in get params" };
  }

  const session_key = req.get('X-Yobs-User-Session-Key') || req.cookies.user_session_key;
  const user_session = _validate_sesson_key(session_key);
  if(user_session) {
    req.user_session = user_session;
    next();
  } else {
    _get_db_session(session_key, (error, user_session) => {
      if(error || !user_session) {
        res.header("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendStatus(error == 'not_found' ? 403 : 500);
      } else {
        g_session_cache[session_key] = {
          create_ts: Date.now(),
          session: user_session,
        };
        req.user_session = user_session;
        next();
      }
    });
  }
}
function createSession(user,done,connection) {
  var user_session_key = false;

  async.series([
    (done) => {
      crypto.randomBytes(24, (error, buf) => {
        if(error) {
          util.errorLog("createSession: randomBytes err:", error);
        } else {
          user_session_key = buf.toString('base64');
        }
        done(error);
      });
    },
    (done) => {
      var query = connection ? db.query.bind(null,connection) : db.queryFromPool;
      var sql = "INSERT INTO yobs_user_session SET ?";
      var values = {
        user_session_key: user_session_key,
        user_id: user.user_id,
      };

      query(sql, values, (error, results) => {
        if(error) {
          util.errorLog("createSession: sql err:", error);
        }
        done(error);
      });
    }],
    (error) => {
      done(error, user_session_key);
    }
  );
}
function removeAllSessions(user_id,done) {
  const sql = "DELETE FROM yobs_user_session WHERE user_id = ?";
  db.queryFromPool(sql, user_id, (error, results) => {
    if(error) {
      util.errorLog("removeAllSessions: sql err:",error);
    }
    done(error);
  });
}
function requireEmployerSession(req,res,next) {
  requireValidSession(req,res, () => {
    if(req.user_session.is_employer) {
      next();
    } else {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendStatus(403);
    }
  });
}
function requireValidSession(req,res,next) {
  addSession(req, res, () => {
    if(req.user_session) {
      next();
    } else {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendStatus(403);
    }
  });
}
