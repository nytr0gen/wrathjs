var Wrathjs = require('../');

var wrath = new Wrathjs();
var page = wrath.create({
    'viewportSize': {
        width: 888,
        height: 666
    },
    'settings.userAgent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0'
});

page.open('http://www.google.com').then(function() {
    return this.get('cookies').then(console.log);
}).then(function() {
    return this.render('page.png');
}).catch(function (err) {
    console.error(err.stack);
}).finally(function() {
    wrath.exit();
});
