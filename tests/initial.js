var Wrathjs = require('../index');

var wrath = new Wrathjs();
page = wrath.create();

page.open('http://www.google.com').then(function () {
    this.type('#lst-ib', 'valoare');
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

    wrath.exit();
}).catch(function(err) {
    console.log(err.stack);
})
