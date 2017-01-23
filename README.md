# General Principles #
* Get is "READ" and can return 200, 404, or 500
* Post is "CREATE" and should always return an ID. It can return a 200, 400, or 500
* POST with an ID is "UPDATE" and can return 200, 400, 404, or 500
* Delete is "DELETE" and can return 200, 4004, or 500
* Single "GET" endpoints should return objects not a list with only one item
* For POST and PUT, all variables are listed and should be sent as either FormData or JSON
* For GET endpoints, the data is returned identically as it is represented in the database

# Pre-Auth/Session Endpoints #
* get - '/1/company'
* get - '/1/company/:company_id'
* get - '/1/industry/:industry_id'
* get - '/1/industry'
* get - '/1/job_schedule/:job_sched_id'
* get - '/1/job_skill/:job_skill_id'
* get - '/1/jobs'
* get - '/1/job/:job_id'
* get - '/1/school/:school_id'
* get - '/1/shift_type/:shift_type_id'
* get - '/1/skill_type/:skill_type_id'
* get - '/1/user/logout'

* post - '/1/user/register'
* post - '/1/jobs'
* post - '/1/user/login'

# Authenticated Endpoints #
* post - '/1/user'
* post - '/1/user/verify'
* get - '/1/user/verify_email'
* get - '/1/user/current'

# Authenticated Employee-Only Endpoints #
* get - '/1/employee'
* get - '/1/employee/job'
* get - '/1/employee/experience'
* get - '/1/employee/industry'
* get - '/1/employee/schedule'
* get - '/1/employee/skill'
* get - '/1/employee/tipi'
* get - '/1/employee/job'

* get - '/1/employee/job/search

            ?
            (optional)query=
            (optional)industry=
            &radius=bike
            &location=Los%20Angeles,CA
            &page_number=

* get - '/1/employee/job/more_jobs_by

            ?company_id=
             &radius=bike
             &location=Los%20Angeles,CA
             &page_number=

* get - '/1/employee/job/job_list'
  -returns total length of job list


* post - '/1/employee'
* post - '/1/employee_industry'
* post - '/1/employee/experience'
* post - '/1/employee/job'
* post - '/1/employee/skill'
* post - '/1/employee/schedule'
* post - '/1/employee/tipi'
* post - '/1/employee/tipi/quiz'
* post - '/1/employee/job/:employee_job_id'
* post - '/1/employee/schedule/:employee_sched_id'

* put - '/1/employee'

* delete - '/1/employee/industry/:employee_industry_id'
* delete - '/1/employee/experience/:experience_id'
* delete - '/1/employee/job/:employee_job_id'
* delete - '/1/employee/skill/:employee_skill_id'
* delete - '/1/employee/schedule/:employee_sched_id'
* delete - '/1/employee/tipi/:tipi_id'

# Authenticated Employer-Only Endpoints #
* get - '/1/employer'
* get - '/1/employer/job'

* post - '/1/job'
* post - '/1/job/:job_id'
* post - '/1/employer'
* post - '/1/job_schedule'
* post - '/1/job_schedule/:job_sched_id'

* put - '/1/employer/:employer_id'

* delete - '/1/employer/:employer_id'
* delete - '/1/job_schedule/:job_sched_id'
* delete - '/1/job/:job_id'