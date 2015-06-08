var phantom = require('node-phantom-simple');
var Promise = require('bluebird');
var deasync = require('deasync');
var Page = require('./page');

function Wrathjs(params, phPath) {
    // TODO: --load-images=no and other args
    this._ph = this._initPhantom(params, phPath);
};
module.exports = Wrathjs;

Wrathjs.prototype._initPhantom = function(parameters, phPath) {
    var ph = null;
    var opts = {
        parameters: parameters || {},
        phPath: phPath || 'phantomjs'
    };
    phantom.create(function (err, phInCb) {
        if (err) {
            console.error(err);
            process.exit();
        } else {
            ph = phInCb;
        }
    }, opts);

    while (ph === null) {
        deasync.runLoopOnce();
    }

    return ph;
};

Wrathjs.prototype.create = function() {
    // TODO: options to load jquery in page
    // TODO: also look for lightweight alternatives
    var page = null;

    this._ph.createPage(function (err, pageInCb) {
        if (err) {
            console.error(err);
            process.exit();
        } else {
            page = new Page(pageInCb);
        }
    });

    while (page === null) {
        deasync.runLoopOnce();
    }

    return page;
};

Wrathjs.prototype.exit = function() {
    this._ph.exit();
};
