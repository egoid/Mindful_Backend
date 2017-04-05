Backend Boilerplate for Amazon RDS and NodeJS Application

Created by Adam T.

# General Principles #
* Get is "READ" and can return 200, 404, or 500
* Post is "CREATE" and should always return an ID. It can return a 200, 400, or 500
* POST with an ID is "UPDATE" and can return 200, 400, 404, or 500
* Delete is "DELETE" and can return 200, 4004, or 500
* Single "GET" endpoints should return objects not a list with only one item
* For POST and PUT, all variables are listed and should be sent as either FormData or JSON
* For GET endpoints, the data is returned identically as it is represented in the database

# Pre-Auth/Session Endpoints #

# Authenticated Endpoints #

# Authenticated Employee-Only Endpoints #

# Authenticated Employer-Only Endpoints #



