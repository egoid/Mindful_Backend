/*====================== User Registration Request ======================*/
var json_data = JSON.stringify({
  email: "saronoff@gmail",
  password: "foobar",
  user_type: "employee",
  user_role_id: 1
});

var xhr = new XMLHttpRequest();
xhr.onerror = function() { console.log(this.arguments); };
xhr.open('POST', 'http://localhost:3020/prod/1/user/register', true);
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(json_data);

/*====================== Current User Request ======================*/
var xhr = new XMLHttpRequest();
xhr.onerror = function() { console.log(this.arguments); };
xhr.open('GET', 'http://localhost:3020/prod/1/user/current', true);
xhr.setRequestHeader('X-Yobs-User-Session-Key', 'AGNMvjbWHjZpT+ACoP85Z66DY/e8UW1y');
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send();

/*====================== User Login Request ======================*/
var json_data = JSON.stringify({
  email: "saronoff@gmail",
  password: "foobar"
});

var xhr = new XMLHttpRequest();
xhr.onerror = function() { console.log(this.arguments); };
xhr.open('POST', 'http://localhost:3020/prod/1/user/login', true);
xhr.setRequestHeader('X-Yobs-User-Session-Key', '/J/MH15ec+bGHE78fOxo0YCVWTk1kB/8');
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(json_data);
