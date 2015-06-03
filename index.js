var phantom = require('phantom');
var Promise = require('bluebird');
var deasync = require('deasync');

var Page = require('./page');
// phantom.create(function(ph) {
//     ph.createPage(function(page) {
//         page.open("http://www.google.com", function(status) {
//             console.log("opened google? ", status);
//             console.log(page.injectJs);
//             console.log(page.evaluateJavaScript);
//             page.get('cookies', function(data) {
//                 console.log('data', data);
//             })
//             page.evaluate(function() {
//                 return document.title;
//             }, function(result) {
//                 console.log('Page title is ' + result);
//                 ph.exit();
//             });
//         });
//     });
// });

function Wrathjs() {
    this._ph = this._initPhantom();
};
module.exports = Wrathjs;

Wrathjs.prototype._initPhantom = function() {
    var ph = null;
    phantom.create(function (phInCb) {
        ph = phInCb;
    });

    while (ph === null) {
        deasync.runLoopOnce();
    }

    return ph;
};

Wrathjs.prototype.createPage = function(url) {
    var page = null;

    this._ph.createPage(function (pageInCb) {
        page = new Page(pageInCb, url);
    });

    while (page === null) {
        deasync.runLoopOnce();
    }

    return page;
};

Wrathjs.prototype.exit = function() {
    this._ph.exit();
};
