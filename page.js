var path = require('path');
var Promise = require('bluebird');
var deasync = require('deasync');
var eventKeys = require('./utils/eventKeys');

const JQUERY_PATH = path.join(__dirname, './utils/jquery.js');

function Page(phPage, url) {
    this.keys = eventKeys;

    phPage.evaluateAsync = null;
    this._page = Promise.promisifyAll(phPage);
    this._waiting = [];
    this._loadingPage = false;
    this._waitLock = null;

    this._page.onLoadStarted = function() {
        console.log('does this work?');
        this._loadingPage = true;
    }.bind(this);
    this._waitLock = null;

    this._page.onUrlChanged = function() {
        console.log('does this work urlChange?');
        this._loadingPage = true;
    }.bind(this);

    this._page.onLoadFinished = function(status) {
        console.log('yes');
        this._loadingPage = false;
    }.bind(this);
};
module.exports = Page;

Page.prototype._injectJquery = function () {
    return this._page.injectJsAsync(JQUERY_PATH).bind(this);
};

Page.prototype.open = function (url) {
    console.log(1);
    return this._page.openAsync(url).bind(this)
    .then(function(status) {
        console.log(2);
        return this._injectJquery().then(function() {console.log(3);return status;});
    });
};
Page.prototype.get = function(name) {
    return this._page.getAsync(name).bind(this);
};

Page.prototype.set = function(name, value) {
    return this._page.setAsync(name, value).bind(this);
};

Page.prototype.evaluate = function (fn) {
    var extraArgs = [].slice.call(arguments, 1);
    console.log(extraArgs);
    return new Promise(function(resolve, reject) {
        var cb = function(err, result) {
            if (err) reject(err);
            else resolve(result);
        };
        var args = [fn, cb].concat(extraArgs);

        this._page.evaluate.apply(this._page, args);
    }.bind(this)).bind(this).then(function(result) {
        return result;
    });
};

Page.prototype._getOffset = function(selector) {
    return this.evaluate(function(selector) {
        return $(selector).offset();
    }, selector);
};


Page.prototype._waitingPush = function (promiseFn) {
    this._waiting.push(promiseFn);
};

Page.prototype._waitingClear = function () {
    this._waiting.length = 0;
};

Page.prototype.click = function(selector) {
    // TODO: arguments for hardcoded +3
    var promiseFn = function() {
        return this._getOffset(selector).then(function(offset) {
            console.log(offset);
            if (offset) {
                this._page.sendEvent('click', offset.left + 3, offset.top + 3);
            } else {
                console.error('Selector ' + selector + ' not found');
            }
        });
    }.bind(this);

    this._waitingPush(promiseFn);
};

//TODO: why doesn't it work
Page.prototype.blur = function(selector) {
    return this.evaluate(function(selector) {
        $(selector).blur();
    }, selector);
};

Page.prototype.focus = function(selector) {
    return this.evaluate(function(selector) {
        $(selector).focus();
    }, selector).then(function(result) {
        return result;
    });
};

/**
* delay - delay between writing letters {default: 80}
* pressTab - pressTab tab after writing {default: true}
*/
Page.prototype.type = function(selector, text, delay, pressTab) {
    delay = delay || 80;
    pressTab = pressTab || true;
    var promiseFn = function() {
        return this.focus(selector).then(function() {
            console.log('startKeyPress');
            // this._page.sendEvent('keypress', text);
            for (var i = 0; i < text.length; i++) {
                this._page.sendEvent('keypress', text[i]);
                deasync.sleep(delay);
            }
            console.log('endType');

            // if (pressTab) {
            //     this._page.sendEvent('keypress', this.keys.Tab);
            // }
        });
    }.bind(this);

    this._waitingPush(promiseFn);
};

Page.prototype.render = function(file) {
    return this._page.renderAsync(file).bind(this);
};

Page.prototype.waitClick = function() {
    return this.wait().then(function(results) {
        this._waitingClear();
        while (this._loadingPage) {
            deasync.sleep(50);
        }

        return this._injectJquery().then(function() {
            console.log('injected jquery');
            return results;
        });
    });
}

Page.prototype.wait = function() {
    if (this._waitLock !== null) {
        console.log('hit waitLock');
        return this._waitLock;
    }

    console.log('triggering each job');
    this._waitLock = Promise.resolve(this._waiting).bind(this)
        .each(function(promiseFn) {
            return promiseFn();
        }).then(function() {
            this._waitingClear();
            this._waitLock = null;
        });

    return this._waitLock;
};

Page.prototype.close = function() {
    this._page.close();
    // TODO: check if it has callback
};
