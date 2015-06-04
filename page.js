var path = require('path');
var Promise = require('bluebird');
var deasync = require('deasync');
var eventKeys = require('./utils/eventKeys');

const JQUERY_PATH = path.join(__dirname, './utils/jquery.js');

function Page(phPage, url) {
    this._page = phPage;
    this._waiting = Promise.resolve();
    this.keys = eventKeys;
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
        this._page.open(url, function (status) {
            if (status == 'fail') {
                reject(new Error('couldn\'t load url ' + url));
            } else {
                resolve();
            }
        });
    }.bind(this)).bind(this).then(function() {
        return this._injectJquery();
    });
};

Page.prototype._waitingPush = function (promiseFn) {
    this._waiting = this._waiting.then(function() {
        return promiseFn;
    });
};

Page.prototype.evaluate = function (fn, args) {
    return new Promise(function(resolve, reject) {
        this._page.evaluate.apply(
            this._page,
            [fn, resolve].concat(args)
        );
    }.bind(this)).bind(this);
};

Page.prototype._getOffset = function(selector) {
    return this.evaluate(function(selector) {
        return $(selector).offset();
    }, [selector]);
};

Page.prototype.click = function(selector) {
    // TODO: arguments for hardcoded +3
    var promise = this._getOffset(selector).then(function(offset) {
        if (offset) {
            this._page.sendEvent('click', offset.left + 3, offset.top + 3);
        } else {
            console.error('Selector ' + selector + ' not found');
        }
    });

    this._waitingPush(promise);
};

//TODO: why doesn't it work
Page.prototype.blur = function(selector) {
    return this.evaluate(function(selector) {
        $(selector).blur();
    }, [selector]);
};

Page.prototype.focus = function(selector) {
    return this.evaluate(function(selector) {
        $(selector).focus();
    }, [selector]);
};

/**
* delay - delay between writing letters {default: 80}
* pressTab - pressTab tab after writing {default: true}
*/
Page.prototype.type = function(selector, text, delay, pressTab) {
    delay = delay || 80;
    pressTab = pressTab || true;
    var promise = this.focus(selector).then(function() {
        for (var i = 0; i < text.length; i++) {
            this._page.sendEvent('keypress', text[i]);
            deasync.sleep(delay);
        }

        if (pressTab) {
            this._page.sendEvent('keypress', this.keys.Tab);
        }
    });

    this._waitingPush(promise);
};

Page.prototype.render = function(file) {
    return new Promise(function(resolve, reject) {
        this._page.render(file, resolve);
    }.bind(this)).bind(this);
};

Page.prototype.waitClick = function() {
    return this.wait().delay(2000).then(function(results) {
        return this._injectJquery().then(function() {
            return results;
        });
    });
}

Page.prototype.wait = function() {
    return this._waiting.bind(this);
};

Page.prototype.close = function() {
    this._page.close();
    // TODO: check if it has callback
}
