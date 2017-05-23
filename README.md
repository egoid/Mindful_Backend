Clarity v1.0 Backend Specs
Adam T.
5/2017

All requests must include session_key except AUTH POST ROUTES

DOCTOR GET ROUTES

GET /doctor/quizzes
Input { session_key }
Output { encrypted list of all quizzes }
-convert_session_key
-Select doctor_id from doctors where user_id = ?
-Select * from quizzes where doctor_id = ?
-Return encrypt_contents

GET /doctor/patients
Input { session_key }
Output { encrypted list of all patients }
-convert_session_key
-Select doctor_id from doctors where user_id = ?
-Select * from patients where doctor_id = ?
-Return encrypt_contents

GET /doctor/scores
Input { session_key , patient_id , quiz_id }
Output { encrypted scores from a specific quiz and patient }
-convert_session_key
-Select doctor_id from doctors where user_id = ?
-Select doctor_id from patients where patient_id = ?
-If doctors.doctor_id === patients.doctor_id
-Select * from scores where patient_id = ? and quiz_id = ?
-Return encrypt_contents

DOCTOR  POST ROUTES

POST /doctor/create_quiz
POST /doctor/edit_quiz
POST /doctor/delete_quiz
POST /doctor/create_patient
POST /doctor/update_patient
POST /doctor/delete_patient
POST /doctor/send_records_to

AUTH POST ROUTES

POST /register
Input { user , email ,  password , first_name , last_name }
Output { session_key , api_key }
-Select * from users where email = ?
-If Not Exists
-Create password hash with Bcrypt
-Insert into Users ( email , password , user_type )
- Doctor ? 
-Create url (first_name(0,3) + last_name(0,3) + randomInt )
-Create random token as session_key
-Create random token as api_key
-Insert into Doctors ( first_name , last_name , is_doctor , session_key , api_key , url)
-Select * from Sessions where user_id = ?
-Insert into Sessions ( user_id , sessions_key , ip_address , browser, OS )
-or Update Sessions ( user_id , sessions_key , ip_address , browser, OS )
-Return ( session_key , api_key )

POST /login
Input { user , email ,  password , first_name , last_name }
Output { session_key , api_key }
-Bcrypt compare password to users.hashed_password
-If True
- User_type is Doctor?
-Create random token as session_key
-Create random token as api_key
-Update Doctors session_key
-Select * from Sessions where user_id = ?
-Insert into Sessions ( user_id , sessions_key , ip_address , browser, OS 
-or Update Sessions ( user_id , sessions_key , ip_address , browser, OS )
-Return ( random token , api_key )

POST /refresh
Input { session_key }
Output { api_key }
-Select api_key , ip_address from Sessions where session_key = ?
-If ip_address, browser, OS matches
-Return api_key




SQL TABLES
Users
User_id , email , password , user_type

Doctors
Doctor_id , user_id , first_name, last_name, url , verified , bililng_plan , plan_end_date , is_deleted , session_key

Sessions
Session_id , user_id , session_key , api_key , ip_address , expiry_date

Quizzes
Quiz_id , doctor_id, json_blob , created_at , modified_at

Scores
Score_id , quiz_id , patient_id , score , taken_at

Patients
Patient_id , doctor_id , username , password , name , email, phone , session_key



MIDDLEWARE

convert_session_key
Input { session_key } 
Return { user_id , api_key } || 404

encrypt_contents
Input { api_key , data }
Return { encrypted_data }


CRON TASKS

Check_for_expired_keys
Check_for_plan_end

