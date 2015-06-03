var path = require('path');
var Promise = require('bluebird');

const JQUERY_PATH = path.join(__dirname, './utils/jquery.js');

function Page(phPage, url) {
    this._page = phPage;
    this._waitingList = [];

    return this.open(url);
};
module.exports = Page;

Page.prototype._injectJquery = function () {
    return new Promise(function (resolve, reject) {
        this._page.injectJs(JQUERY_PATH, function (wasSuccessful) {
            if (!wasSuccessful) {
                reject(new Error('couldn\'t inject jquery'));
            } else {
                resolve();
            }
        });
    }.bind(this)).bind(this);
};

Page.prototype.open = function (url) {
    return new Promise(function (resolve, reject) {
        this._page.open(url, resolve);
    }.bind(this)).bind(this).then(function (status) {
        console.log(this);
        return this._injectJquery().then(function() {
            return status;
        });
    });
};

Page.prototype._waitingPush = function (promiseFn) {
    this._waitingList.push(promiseFn);
};

Page.prototype._waitingClear = function (promiseFn) {
    this._waitingList = [];
};

Page.prototype.evaluate = function (fn, args) {
    return new Promise(function(resolve, reject) {
        this._page.evaluate.apply(
            this._page,
            [fn, resolve].concat(args)
        );
    }.bind(this));
};

Page.prototype.click = function(selector) {
    this._waitingPush(
        this.evaluate(function(selector) {
            $(selector).click();
        }, [selector])
    );
};

Page.prototype.wait = function() {
    return Promise.all(this._promises).bind(this)
    .then(function(results) {
        this._waitingClear();

        return results;
    });
};
