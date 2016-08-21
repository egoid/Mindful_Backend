# General Principles #
* Get is "READ" and can return 200, 404, or 500
* Post is "CREATE" and should always return an ID. It can return a 201, 400, or 500
* Put is "UPDATE" and can return 200, 400, 404, or 500
* Delete is "DELETE" and can return 200, 4004, or 500
* Single "GET" endpoints should return objects not a list with only one item
* For POST and PUT, all variables are listed and should be sent as either FormData or JSON
* For GET endpoints, the data is returned identically as it is represented in the database

# User Endpoints #
* post - '/1/user/register'
    * email
    * password
    * user_type is one of ['employee','employer free','employer_paid_1','employer_paid_2']
        * defaults to "employee"
    * user_role_id
* get - '/1/user/current'

# User Role Endpoints #
* post - '/1/user_role'
    * name => user_role_name
    * type => user_role_descr
* get - '/1/user_role/:user_role_id'
* put - '/1/user_role/:user_role_id'
    * name => user_role_name
    * type => user_role_descr
* delete - '/1/user_role/:user_role_id'

# Login Endpoint #
* post - '/1/user/login'
    * email
    * password

# Company Endpoints #
* post - '/1/company'
    * name
    * industry
        * id (optional)
        * name => industry_name
        * type => industry_type
    * email_domain
    * property_bag (JSON)
* get - '/1/company/:company_id', get_company);

# Single Job Endpoints #
* post - '/1/job'
* get - '/1/job/:job_id'
* put - '/1/job/:job_id'
* delete - '/1/job/:job_id'

# Single Job Schedule Endpoints #
* post - '/1/job/:job_id/schedule'
* get - '/1/job_schedule/:job_sched_id'
* put - '/1/job_schedule/:job_sched_id'
* delete - '/1/job_schedule/:job_sched_id'

# Single Job Skill Endpoints #
* get - '/1/job_skill/:job_skill_id'
* delete - '/1/job_skill/:job_skill_id'

# Single Employee Endpoints #
* post - '/1/employee'
* get - '/1/employee/:employee_id'
* put - '/1/employee/:employee_id'

# Single Employer Endpoints #
* post - '/1/employer'
* get - '/1/employer/:employer_id'
* put - '/1/employer/:employer_id'
* delete - '/1/employer/:employer_id'

# Single Employee Experience Endpoints #
* post - '/1/employee/:employee_id/experience'
* get - '/1/experience/:experience_id'
* delete - '/1/experience/:experience_id'

# Single Employee Experience Endpoints #
* post - '/1/employee/:employee_id/job'
* get - '/1/employee_job/:employee_job_id'
* delete - '/1/employee_job/:employee_job_id'

# Single Employee Role Endpoints #
* post - '/1/employee/:employee_id/role'
* get - '/1/employee_role/:employee_role_id'
* delete - '/1/employee_role/:employee_role_id'

# Single Employee Skill Endpoints #
* post - '/1/employee/:employee_id/skill'
* get - '/1/employee_skill/:employee_skill_id'
* delete - '/1/employee_skill/:employee_skill_id'

# Single Employee Schedule Endpoints #
* post - '/1/employee/:employee_id/schedule'
* get - '/1/employee_schedule/:employee_sched_id'
* put - '/1/employee_schedule/:employee_sched_id'
* delete - '/1/employee_schedule/:employee_sched_id'

# Get List of Companies *
* get - '/1/company'

# Get List of Jobs #
* get - '/1/employee/:employee_id/job'
* get - '/1/employer/:employer_id/job'

# Get List of Skills by Employee #
* get - '/1/employee/:employee_id/skill'

# Get List of Schedules by Employee #
* get - '/1/employee/:employee_id/schedule'

# Get List of Experiences by Employee #
* get - '/1/employee/:employee_id/experience'

# Job Search #
* get - '/1/jobs'
