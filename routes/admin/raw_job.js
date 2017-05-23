'use strict';

const _ = require('lodash');
const express = require('express');
const db = require('../../mysql_db.js');

const router = new express.Router();
exports.router = router;

router.get('/1/user_list/', get_user_list);
router.get('/1/query/', query_database);

function get_user_list(req,res) {
  var ua = req.headers['user-agent'],
  $ = {};

  if (/mobile/i.test(ua))
      $.Mobile = true;

  if (/like Mac OS X/.test(ua)) {
      $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
      $.iPhone = /iPhone/.test(ua);
      $.iPad = /iPad/.test(ua);
  }

  if (/Android/.test(ua))
      $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

  if (/webOS\//.test(ua))
      $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

  if (/(Intel|PPC) Mac OS X/.test(ua))
      $.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;

  if (/Windows NT/.test(ua))
      $.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

  var ip = req.ip
  const values = [];
  let sql = "show tables" 

  db.connectAndQuery({ sql, values }, (error, results) => {
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {  
      res.status(200).send(ip);
    }
  });
};

function query_database(req, res) {
  const values = [];
  let sql = String(req.query.query).replace(/\>/g , ' ')
  console.log(sql)

  db.connectAndQuery({ sql, values }, (error, results) => {
    console.log(results)
    if(error) {
      console.error(error);
      res.sendStatus(500);
    } else {  
      res.status(200).send(results);
    }
  });
}