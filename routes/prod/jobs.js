'use strict';

const _ = require('lodash');
const async = require('async');
const express = require('express');
const ejs = require('ejs');
const config = require('node-config-sets');

const db = require('../../db.js');
const session = require('../../session.js');
const util = require('../../util.js');

const router = new express.Router();
exports.router = router;

const COMPANY_PROPS = [
  "Id",
  "Name",
  "IndustryId",
  "EmailDomain",
  "PropertyBag",
  "CreatedDate",
  "CreatedBy",
  "ModifiedDate",
  "ModifiedBy",
  "Deleted",
  "DeletedDate",
  "DeletedBy",
];

const JOB_TYPE_PROPS = [
  "Id",
  "Name",
  "Type",
];

const JOB_ROLE_PROPS = [
  "Id",
  "Name",
  "Role",
];

const SKILL_TYPE_PROPS = [
  "Id",
  "Name",
  "Type",
];

const JOB_PROPS = [
  "Id",
  "CompanyId",
  "EmployerId",
  "RoleId",
  "JobTypeId",
  "Title",
  "PayRateMin",
  "PayRateMax",
  "JobScheduleId",
  "MinGPA",
  "SchoolLevelId",
  "Description",
  "Responsibilities",
  "Activities",
  "IsYobsClient",
  "ExternalUrl",
  "PostedDate",
  "TakedownDate",
  "CreatedDate",
  "CreatedBy",
  "ModifiedDate",
  "ModifiedBy",
  "Deleted",
  "DeletedDate",
  "DeletedBy"
];

router.get('/1/jobs', session.requireValidSession, get_jobs);

function get_jobs(req, res) {
  const job_sql =
"SELECT job.*, company.*, job_type.*, job_role.*, school_level.* " +
"FROM job " +
"INNER JOIN company USING(company_id) " +
"INNER JOIN job_type USING(job_type_id) " +
"INNER JOIN job_role USING(job_role_id) " +
"INNER JOIN school_level USING(school_level_id)";
}
