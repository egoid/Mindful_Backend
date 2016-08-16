/*====================== Company Create Request ======================*/
var json_data = JSON.stringify({
  name: "Testing",
  email_domain: "samdrey.com",
  property_bag: {
    stuff: "one",
    stuff: "two"
  },
  industry: {
    name: "Something",
    type: "Something More"
  }
});

var xhr = new XMLHttpRequest();
xhr.onerror = function() { console.log(this.arguments); };
xhr.open('POST', 'http://localhost:3020/prod/1/company', true);
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(json_data);
