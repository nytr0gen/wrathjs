var webPage = require('webpage');
var page = webPage.create();

page.open('http://mail.yahoo.com/', function(status) {
  console.log('Status: ' + status);
  // Do other things here...
  var title = page.evaluate(function() {
    return document.title;
  });

  console.log(title);
});
