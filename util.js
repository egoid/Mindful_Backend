function errorLog() {
  console.error(this.arguments);
}
function require_employer_id(req, res, next) {
  console.log('employer');

  if(!req.user.employer_id || req.user.employer_id < 1) {
    res.status(403).send("Unknown employer.");
  } else {
    next();
  }
}
function require_employee_id(req, res, next) {
  console.log('employee');

  if(!req.user.employee_id || req.user.employee_id < 1) {
    res.status(403).send("Unknown employee.");
  } else {
    next();
  }
}

exports.require_employee_id = require_employee_id;
exports.require_employer_id = require_employer_id;
exports.errorLog = errorLog;
