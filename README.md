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
    * company
        * id
        * name
        * industry
            * id (optional)
            * name => industry_name
            * type => industry_type
        * email_domain
        * property_bag (JSON)
    * job_role
        * id (optional)
        * name => job_role_name
        * type => job_role_descr
    * job_type
        * id (optional)
        * name => job_type_name
        * type => job_type_descr
    * name
    * title
    * employer_id
    * location
    * pay_rate_min
    * pay_rate_max
    * min_gpa
    * description
    * external_url
    * posted_at
    * takedown_at
* get - '/1/job/:job_id'
* put - '/1/job/:job_id'
    * name
    * title
    * employer_id
    * location
    * pay_rate_min
    * pay_rate_max
    * min_gpa
    * description
    * external_url
    * posted_at
    * takedown_at
* delete - '/1/job/:job_id'

# Single Job Schedule Endpoints #
* post - '/1/job/:job_id/schedule'
    * schedule (list)
        * Seven-item list, sunday is 0, each value should be one of ['all','none','morning','afternoon','evening','night']
* get - '/1/job_schedule/:job_sched_id'
* put - '/1/job_schedule/:job_sched_id'
    * schedule (list)
        * Seven-item list, sunday is 0, each value should be one of ['all','none','morning','afternoon','evening','night']
* delete - '/1/job_schedule/:job_sched_id'

# Single Job Skill Endpoints #
* post - '/1/job/:job_id/skill'
    * skill_type_id
* get - '/1/job_skill/:job_skill_id'
* delete - '/1/job_skill/:job_skill_id'

# Single Employee Endpoints #
* post - '/1/employee'
    * user_id
    * school_id
    * location_name
    * transportation ['walk','bike','metro','car']
    * tipi_score_id
    * headline
    * school_level
    * gpa
    * schedule_id
* get - '/1/employee/:employee_id'
* put - '/1/employee/:employee_id'
    * school_id
    * location_name
    * transportation ['walk','bike','metro','car']
    * tipi_score_id
    * headline
    * school_level
    * gpa
    * schedule_id

# Single Employer Endpoints #
* post - '/1/employer'
    * user_id
    * location_name
* get - '/1/employer/:employer_id'
* put - '/1/employer/:employer_id'
    * location_name
* delete - '/1/employer/:employer_id'

# Single Employee Experience Endpoints #
* post - '/1/employee/:employee_id/experience'
    * company
    * job_role_id
    * start (DATETIME)
    * end (DATETIME)
* get - '/1/experience/:experience_id'
* delete - '/1/experience/:experience_id'

# Single Employee Job Endpoints #
* post - '/1/employee/:employee_id/job'
    * job_id
    * interview_date (DATETIME)
    * status ['saved','submitted','reviewed','interview','offer','pass']
* get - '/1/employee_job/:employee_job_id'
* put - '/1/employee_job/:employee_job_id'
    * interview_date (DATETIME)
    * status ['saved','submitted','reviewed','interview','offer','pass']
* delete - '/1/employee_job/:employee_job_id'

# Single Employee Skill Endpoints #
* post - '/1/employee/:employee_id/skill'
    * skill_type_id
* get - '/1/employee_skill/:employee_skill_id'
* delete - '/1/employee_skill/:employee_skill_id'

# Single Employee Schedule Endpoints #
* post - '/1/employee/:employee_id/schedule'
    * schedule (list)
        * Seven-item list, sunday is 0, each value should be one of ['all','none','morning','afternoon','evening','night']
* get - '/1/employee_schedule/:employee_sched_id'
* put - '/1/employee_schedule/:employee_sched_id'
    * schedule (list)
        * Seven-item list, sunday is 0, each value should be one of ['all','none','morning','afternoon','evening','night']
* delete - '/1/employee_schedule/:employee_sched_id'

# Single Employee Interested Industries #
* post - '/1/employee_industry'
    * employee_id
    * industry_id
* delete - '/1/employee_industry/:employee_industry_id'

# Get List of Companies #
* get - '/1/company'

# Get List of Industries #
* get - '/1/industry'

# Get List of Jobs #
* get - '/1/employee/:employee_id/job'
* get - '/1/employer/:employer_id/job'

# Get List of Experiences by Employee #
* get - '/1/employee/:employee_id/experience'

# Get List of Industries of Interest for Employee #
* get - '/1/employee/:employee_id/industry'

# Get List of Schedules by Employee #
* get - '/1/employee/:employee_id/schedule'

# Get List of Skills by Employee #
* get - '/1/employee/:employee_id/skill'

# Get TIPI Score for Employee #
* get - '/1/employee/:employee_id/tipi'

# Job Search #
* get|post - '/1/jobs'
    * location (REQUIRED - an address as a string)
    * radius (a radius label: ['walk', 'bike', 'metro', 'car'] - default 'bike')
    * search (a string to search)
    * industry_id (an industry to restrict jobs)
