var Wrathjs = require('../index');

var wrath = new Wrathjs();
page = wrath.create();

page.open('http://www.google.com').then(function () {
    this.type('[name=q]', 'valoare');
    this.click('[name=btnI]');

    return this.waitClick();
}).then(function() {
    // console.log('Page title is', result);

    return this.render('poza.jpg');
}).then(function() {
    return this.open('https://www.yahoo.com');
}).then(function () {
    return this.evaluate(function() {
        return $('title').text();
    });
}).then(function(result) {
    console.log('Page title2 is', result);

    // Testing if it times out
    return this.waitClick('[type=submit]');
}).then(function(result) {

}).catch(function(err) {
    wrath.exit();
    console.log(err.stack);
    return this.get('content').then(function(result) {
        // console.log(result);
        console.log('this.get(content) in catch of length ', result.length);
    }).finally(function() {
        console.log(3421423);
    })
}).finally(function() {
    console.log('exit');
    wrath.exit();
});
