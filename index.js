var phantom = require('node-phantom-simple');
var deasync = require('deasync');
var Promise = require('bluebird');
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
        path: phPath || 'phantomjs'
    };
    phantom.create(opts, function (err, phInCb) {
        if (err) {
            console.error(err);
            process.exit();
        } else {
            ph = phInCb;
        }
    });

    while (ph === null) {
        deasync.runLoopOnce();
    }

    return ph;
};

Wrathjs.prototype.create = function(opts) {
    // TODO: options to load jquery in page
    // TODO: also look for lightweight alternatives
    var phPage = null;

    this._ph.createPage(function (err, pageInCb) {
        if (err) {
            console.error(err);
            process.exit();
        } else {
            phPage = pageInCb;
        }
    });

    while (phPage === null) {
        deasync.runLoopOnce();
    }

    return new Page(phPage, opts);
};

Wrathjs.prototype.exit = function() {
    this._ph.exit();
};
