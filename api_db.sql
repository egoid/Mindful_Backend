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

CREATE TABLE employment_type (
  employment_type_id INT NOT NULL AUTO_INCREMENT,
  employment_type_name varchar(255),
  employment_type_descr varchar(255),
  PRIMARY KEY (employment_type_id),
  UNIQUE KEY un_employment_type (employment_type_name)
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

CREATE TABLE school_level (
  school_level_id int not null auto_increment,
  school_level_name varchar(255),
  school_level_descr varchar(255),
  PRIMARY KEY (school_level_id),
  UNIQUE KEY un_school_level_descr (school_level_descr)
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

CREATE TABLE user_type (
  user_type_id int not null auto_increment,
  user_type_name varchar(255),
  user_type_descr varchar(255),
  PRIMARY KEY (user_type_id),
  UNIQUE KEY un_user_type_descr (user_type_descr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE company (
  company_id INT NOT NULL AUTO_INCREMENT,
  name varchar(255),
  industry_id INT,
  email_domain varchar(255),
  property_bag blob,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INT DEFAULT NULL,
  modified_at DATETIME,
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
  school_level_id INT,
  description text,
  responsibilities text,
  activities text,
  is_yobs_client boolean,
  external_url text,
  posted_at DATETIME,
  takedown_at DATETIME,
  created_at DATETIME,
  created_by INT,
  modified_at DATETIME,
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

  latitude_lower_transit float DEFAULT NULL,
  longitude_lower_transit float DEFAULT NULL,
  latitude_upper_transit float DEFAULT NULL,
  longitude_upper_transit float DEFAULT NULL,

  latitude_lower_drive float DEFAULT NULL,
  longitude_lower_drive float DEFAULT NULL,
  latitude_upper_drive float DEFAULT NULL,
  longitude_upper_drive float DEFAULT NULL,

  PRIMARY KEY (job_id),

  KEY latitude (latitude),
  KEY longitude (longitude),
  KEY latitude_lower_walk (latitude_lower_walk),
  KEY longitude_lower_walk (longitude_lower_walk),
  KEY latitude_upper_walk (latitude_upper_walk),
  KEY longitude_upper_walk (longitude_upper_walk),
  KEY latitude_lower_bike (latitude_lower_bike),
  KEY longitude_lower_bike (longitude_lower_bike),
  KEY latitude_upper_bike (latitude_upper_bike),
  KEY longitude_upper_bike (longitude_upper_bike),
  KEY latitude_lower_transit (latitude_lower_transit),
  KEY longitude_lower_transit (longitude_lower_transit),
  KEY latitude_upper_transit (latitude_upper_transit),
  KEY longitude_upper_transit (longitude_upper_transit),
  KEY latitude_lower_drive (latitude_lower_drive),
  KEY longitude_lower_drive (longitude_lower_drive),
  KEY latitude_upper_drive (latitude_upper_drive),
  KEY longitude_upper_drive (longitude_upper_drive),

  CONSTRAINT job_to_company FOREIGN KEY (company_id) REFERENCES company (company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_to_job_type FOREIGN KEY (job_type_id) REFERENCES job_type (job_type_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_to_role FOREIGN KEY (job_role_id) REFERENCES job_role (job_role_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT job_to_school_level FOREIGN KEY (school_level_id) REFERENCES school_level (school_level_id) ON UPDATE CASCADE ON DELETE CASCADE
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
  user_type_id int,
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
  CONSTRAINT user_type FOREIGN KEY (user_type_id) REFERENCES user_type (user_type_id) ON UPDATE CASCADE ON DELETE CASCADE
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
  PRIMARY KEY (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_job (
  employee_job_id int not null AUTO_INCREMENT,
  employee_id int,
  job_id int,
  status ENUM('saved', 'submitted', 'reviewed', 'interview', 'offer', 'pass'),
  interview_date DATETIME,
  modified_at DATETIME,
  PRIMARY KEY (employee_job_id),
  UNIQUE KEY employee_and_job (employee_id, job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_skill (
  employee_skill_id int not null AUTO_INCREMENT,
  employee_id int,
  skill_type_id int,
  PRIMARY KEY(employee_skill_id),
  UNIQUE KEY employee_and_skill (employee_id, skill_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_role (
  employee_role_id int not null AUTO_INCREMENT,
  employee_id int,
  job_role_id int,
  PRIMARY KEY(employee_role_id),
  UNIQUE KEY employee_and_skill (employee_id, job_role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE school (
  school_id int not null AUTO_INCREMENT,
  name text,
  location_name text,
  location_latitude float,
  location_longitude float,
  PRIMARY KEY(school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE employee_experience (
  employee_experience_id int not null AUTO_INCREMENT,
  employee_id int,
  company varchar(255),
  job_role_id int,
  start_date DATETIME,
  end_date DATETIME,
  PRIMARY KEY(employee_experience_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE tipi_score (
  tipi_score_id int not null AUTO_INCREMENT,
  employee_id int,
  extraversion float,
  agreeableness float,
  conscientiousness float,
  emotional_stability float,
  openness_to_experiences float,
  PRIMARY KEY(tipi_score_id)
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
  PRIMARY KEY(employee_schedule_id)
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
  PRIMARY KEY(job_schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
