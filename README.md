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

# Get List of Jobs #
* get - '/1/employee/:employee_id/job'
* get - '/1/employer/:employer_id/job'

# Get List of Skills by Employee #
* get - '/1/employee/:employee_id/skill'

# Get List of Schedule by Employee #
* get - '/1/employee/:employee_id/schedule'

# Get List of Experience by Employee #
* get - '/1/employee/:employee_id/experience'

# Job Search #
* get - '/1/jobs'
