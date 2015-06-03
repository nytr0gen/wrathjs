var Wrathjs = require('../index');

var wrath = new Wrathjs();

page = wrath.createPage('http://www.google.com');

page.then(function (status) {
    console.log("opened google? ", status);
    return this.evaluate(function () {
        return document.title;
    });
}).then(function(result) {
    console.log('Page title is', result);
    return this.evaluate(function() {
        return $('title').text();
    });

}).then(function(result) {
    console.log('Page title2 is', result);

    wrath.exit();
}).catch(function(err) {
    console.error('error', err);
})
