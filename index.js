var phantom = require('phantom');
var Promise = require('bluebird');
var deasync = require('deasync');
var Page = require('./page');

function Wrathjs() {
    // TODO: --load-images=no and other args
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

Wrathjs.prototype.create = function() {
    // TODO: options to load jquery in page
    // TODO: also look for lightweight alternatives
    var page = null;

    this._ph.createPage(function (pageInCb) {
        page = new Page(pageInCb);
    });

    while (page === null) {
        deasync.runLoopOnce();
    }

    return page;
};

Wrathjs.prototype.exit = function() {
    this._ph.exit();
};
