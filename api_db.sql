CREATE TABLE industry (
  industry_id INT NOT NULL AUTO_INCREMENT,
  industry_name varchar(255),
  industry_type varchar(255),
  PRIMARY KEY (industry_id),
  UNIQUE KEY industry_type (industry_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE company_genera (
  company_genera_id INT NOT NULL AUTO_INCREMENT,
  company_genera_name varchar(255),
  genus varchar(255),
  PRIMARY KEY (company_genera_id),
  UNIQUE KEY un_company_genera_genus (genus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE job_role (
  job_role_id int not null auto_increment,
  job_role_name varchar(255),
  job_role_descr varchar(255),
  PRIMARY KEY (job_role_id),
  UNIQUE un_job_role_descr (job_role_descr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE job_type (
  job_type_id int not null auto_increment,
  job_type_name varchar(255),
  job_type_descr varchar(255),
  PRIMARY KEY (job_type_id),
  UNIQUE KEY un_job_type_descr (job_type_descr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE skill_type (
  skill_type_id int not null auto_increment,
  skill_type_name varchar(255),
  skill_type_descr varchar(255),
  PRIMARY KEY (skill_type_id),
  UNIQUE KEY un_skill_type_descr (skill_type_descr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE shift_type (
  shift_type_id int not null auto_increment,
  shift_type_name varchar(255),
  shift_type_descr varchar(255),
  PRIMARY KEY (shift_type_id),
  UNIQUE KEY (shift_type_descr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE user_role (
  user_role_id int not null auto_increment,
  user_role_name varchar(255),
  user_role_descr varchar(255),
  PRIMARY KEY (user_role_id),
  UNIQUE KEY un_user_role_descr (user_role_descr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE company (
  company_id INT NOT NULL AUTO_INCREMENT,
  name varchar(255),
  industry_id INT,
  email_domain varchar(255),
  property_bag blob,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT DEFAULT NULL,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  modified_by INT,
  is_deleted boolean,
  deleted_at DATETIME,
  deleted_by INT,
  PRIMARY KEY (company_id),
  UNIQUE KEY name (name),
  CONSTRAINT company_to_industry FOREIGN KEY (industry_id) REFERENCES industry (industry_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE job (
  job_id INT NOT NULL AUTO_INCREMENT,
  company_id INT,
  employer_id INT,
  job_role_id INT,
  job_type_id INT,
  title varchar(255),
  pay_rate_min FLOAT,
  pay_rate_max FLOAT,
  job_schedule_id INT,
  min_gpa FLOAT,
  description text,
  responsibilities text,
  activities text,
  is_yobs_client boolean,
  external_url text,
  posted_at DATETIME,
  takedown_at DATETIME,
  created_at DATETIME,
  created_by INT,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  modified_by INT,
  is_deleted boolean,
  deleted_at DATETIME,
  deleted_by INT,
  location text,
  latitude float DEFAULT NULL,
  longitude float DEFAULT NULL,

  latitude_lower_walk float DEFAULT NULL,
  longitude_lower_walk float DEFAULT NULL,
  latitude_upper_walk float DEFAULT NULL,
  longitude_upper_walk float DEFAULT NULL,

  latitude_lower_bike float DEFAULT NULL,
  longitude_lower_bike float DEFAULT NULL,
  latitude_upper_bike float DEFAULT NULL,
  longitude_upper_bike float DEFAULT NULL,

  latitude_lower_metro float DEFAULT NULL,
  longitude_lower_metro float DEFAULT NULL,
  latitude_upper_metro float DEFAULT NULL,
  longitude_upper_metro float DEFAULT NULL,

  latitude_lower_car float DEFAULT NULL,
  longitude_lower_car float DEFAULT NULL,
  latitude_upper_car float DEFAULT NULL,
  longitude_upper_car float DEFAULT NULL,

  PRIMARY KEY (job_id),

  KEY company_id (company_id),
  KEY employer_id (employer_id),
  KEY latitude_lower_walk (latitude_lower_walk),
  KEY longitude_lower_walk (longitude_lower_walk),
  KEY latitude_upper_walk (latitude_upper_walk),
  KEY longitude_upper_walk (longitude_upper_walk),
  KEY latitude_lower_bike (latitude_lower_bike),
  KEY longitude_lower_bike (longitude_lower_bike),
  KEY latitude_upper_bike (latitude_upper_bike),
  KEY longitude_upper_bike (longitude_upper_bike),
  KEY latitude_lower_metro (latitude_lower_metro),
  KEY longitude_lower_metro (longitude_lower_metro),
  KEY latitude_upper_metro (latitude_upper_metro),
  KEY longitude_upper_metro (longitude_upper_metro),
  KEY latitude_lower_car (latitude_lower_car),
  KEY longitude_lower_car (longitude_lower_car),
  KEY latitude_upper_car (latitude_upper_car),
  KEY longitude_upper_car (longitude_upper_car),

  CONSTRAINT job_to_company FOREIGN KEY (company_id) REFERENCES company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_to_job_type FOREIGN KEY (job_type_id) REFERENCES job_type (job_type_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_to_role FOREIGN KEY (job_role_id) REFERENCES job_role (job_role_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE job_skill (
  job_skill_id int not null auto_increment,
  job_id int,
  skill_type_id int,
  PRIMARY KEY (job_skill_id),
  CONSTRAINT job_skill_to_job FOREIGN KEY (job_id) REFERENCES job (job_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_skill_to_skill_type FOREIGN KEY (skill_type_id) REFERENCES skill_type (skill_type_id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY un_job_id_skill_id(job_id, skill_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE user (
  user_id int not null auto_increment,
  alias varchar(255),
  user_type ENUM('employee', 'employer free', 'employer_paid_1', 'employer_paid_2') DEFAULT 'employee',
  email varchar(255),
  password varchar(255),
  user_role_id int,
  facebook_id int,
  linkedin_id int,
  last_login DATETIME,
  modified_date DATETIME,
  modified_by int,
  is_deleted boolean,
  deleted_at DATETIME,
  deleted_by int,
  created_at DATETIME,
  PRIMARY KEY (user_id),
  CONSTRAINT user_role FOREIGN KEY (user_role_id) REFERENCES user_role (user_role_id) ON UPDATE CASCADE ON DELETE CASCADE,
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employer (
  employer_id int not null AUTO_INCREMENT,
  user_id int not null,
  location_name text,
  location_latitude FLOAT,
  location_longitude FLOAT,
  PRIMARY KEY (employer_id)
  CONSTRAINT user FOREIGN KEY (user_id) REFERENCES user (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee (
  employee_id int not null AUTO_INCREMENT,
  user_id int not null,
  school_id int,
  location_name text,
  location_latitude FLOAT,
  location_longitude FLOAT,
  transportation ENUM('walk', 'bike', 'metro', 'car'),
  tipi_score_id int,
  headline varchar(255),
  school_level ENUM('graduate', 'undergraduate', 'highschool'),
  gpa float,
  video_url text,
  schedule_id int,
  PRIMARY KEY (employee_id),
  CONSTRAINT user FOREIGN KEY (user_id) REFERENCES user (user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_interested_industry (
  employee_industry_id int not null AUTO_INCREMENT,
  employee_id int,
  industry_id int,
  PRIMARY KEY (employee_industry_id),
  UNIQUE KEY employee_and_industry (employee_id, industry_id),
  CONSTRAINT industry FOREIGN KEY (industry_id) REFERENCES industry (industry_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_job (
  employee_job_id int not null AUTO_INCREMENT,
  employee_id int,
  job_id int,
  status ENUM('saved', 'submitted', 'reviewed', 'interview', 'offer', 'pass'),
  interview_date DATETIME,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (employee_job_id),
  UNIQUE KEY employee_and_job (employee_id, job_id),
  CONSTRAINT job FOREIGN KEY (job_id) REFERENCES job (job_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_skill (
  employee_skill_id int not null AUTO_INCREMENT,
  employee_id int,
  skill_type_id int,
  PRIMARY KEY(employee_skill_id),
  UNIQUE KEY employee_and_skill (employee_id, skill_type_id),
  CONSTRAINT employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_experience (
  employee_experience_id int not null AUTO_INCREMENT,
  employee_id int,
  company varchar(255),
  job_role_id int,
  start_date DATETIME,
  end_date DATETIME,
  PRIMARY KEY(employee_experience_id),
  CONSTRAINT employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_role FOREIGN KEY (job_role_id) REFERENCES job_role (job_role_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_schedule (
  employee_schedule_id int not null AUTO_INCREMENT,
  employee_id int,
  sunday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  monday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  tuesday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  wednesday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  thursday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  friday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  saturday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  PRIMARY KEY(employee_schedule_id),
  CONSTRAINT employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE school (
  school_id int not null AUTO_INCREMENT,
  name text,
  location_name text,
  location_latitude float,
  location_longitude float,
  PRIMARY KEY(school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE tipi_score (
  tipi_score_id int not null AUTO_INCREMENT,
  employee_id int,
  extraversion float,
  agreeableness float,
  conscientiousness float,
  emotional_stability float,
  openness_to_experiences float,
  PRIMARY KEY(tipi_score_id),
  CONSTRAINT employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE job_schedule (
  job_schedule_id int not null AUTO_INCREMENT,
  job_id int,
  sunday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  monday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  tuesday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  wednesday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  thursday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  friday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  saturday_schedule ENUM('all', 'none', 'morning', 'afternoon', 'evening', 'night'),
  PRIMARY KEY(job_schedule_id),
  CONSTRAINT job FOREIGN KEY (job_id) REFERENCES job (job_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
