'use strict';

var path = require('path');
var Promise = require('bluebird');
var deasync = require('deasync');
var eventKeys = require('./utils/eventKeys');

const JQUERY_PATH = path.join(__dirname, './utils/jquery.js');

function Page(phPage, opts) {
    phPage.evaluateAsync = null;
    this._page = Promise.promisifyAll(phPage);

    this._page.onLoadStarted = function() {
        console.log('Triggered load started');
        this._loadingPage = true;
    }.bind(this);

    this._page.onUrlChanged = function() {
        console.log('Triggered url change');
        this._loadingPage = true;
    }.bind(this);

    this._page.onLoadFinished = function(status) {
        console.log('Triggered load finished');
        this._loadingPage = false;
    }.bind(this);

    this._opts = opts || {};
    this._opts.viewportSize = opts.viewportSize || {
        width: 800,
        height: 600
    };

    var settingsOptsDone = false;
    this.set(this._opts).then(function() {
        settingsOptsDone = true;
    }, function (err) {
        settingsOptsDone = true;
        console.error(err);
        process.exit();
    });

    while (!settingsOptsDone) {
        deasync.runLoopOnce();
    }
};
module.exports = Page;

Page.prototype.keys = eventKeys;

Page.prototype._injectJquery = function () {
    return this._page.injectJsAsync(JQUERY_PATH).bind(this);
};

Page.prototype.open = function (url) {
    return this._page.openAsync(url).bind(this)
    .then(function(status) {
        return this._injectJquery().then(function() {
            return status;
        });
    });
};
Page.prototype.get = function(name) {
    return this._page.getAsync(name).bind(this);
};

Page.prototype.set = function(name, value) {
    if (typeof(name) == 'string') {
        if (name.indexOf('.') == -1) {
            return this._page.setAsync(name, value).bind(this);
        } else {
            var arrName = name.split('.')[0];
            name = name.split('.')[1];

            return this.get(arrName).then(function (arr) {
                arr[name] = value;

                return this.set(arrName, arr);
            });
        }
    } else if (typeof(name) == 'object') {
        var opts = name;

        return Promise.resolve(Object.keys(opts))
        .bind(this).each(function(name) {
            return this.set(name, opts[name]);
        });
    } else {
        return Promise.reject();
    }
};

Page.prototype.evaluate = function (fn) {
    var extraArgs = [].slice.call(arguments, 1);
    var args = [fn, ''].concat(extraArgs);
    return new Promise(function(resolve, reject) {
        args[1] = function(err, result) {
            if (err) reject(err);
            else resolve(result);
        };

        this._page.evaluate.apply(this._page, args);
    }.bind(this)).bind(this);
};

Page.prototype._getOffset = function(selector) {
    return this.evaluate(function(selector) {
        return $(selector)[0].getBoundingClientRect();
    }, selector);
};

Page.prototype.click = function(selector) {
    // TODO: arguments for hardcoded +3
    var promiseFn = function() {
        return this._getOffset(selector).then(function(offset) {
            // console.log(offset);
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
            // console.log('startKeyPress');
            // this._page.sendEvent('keypress', text);
            for (var i = 0; i < text.length; i++) {
                this._page.sendEvent('keypress', text[i]);
                deasync.sleep(delay);
            }
            // console.log('endType');

            // if (pressTab) {
            //     this._page.sendEvent('keypress', this.keys.Tab);
            // }
        });
    }.bind(this);

    this._waitingPush(promiseFn);
};

Page.prototype.render = function(file, selector) {
    if (selector) {
        return this._getOffset(selector).then(function(offset) {
            return this.set('clipRect', offset);
        }).then(function() {
            return this.render(file);
        }).then(function() {
            return this.set('clipRect', {
                width: this._opts.viewportSize.width,
                height: this._opts.viewportSize.height,
                top: 0, left: 0
            });
        })
    } else {
        return this._page.renderAsync(file).bind(this);
    }
};

Page.prototype._loadingPage = false;
Page.prototype.waitClick = function(selector) {
    if (selector) {
        this.click(selector);
    }

    this._loadingPage = true;
    return this.wait().then(function(results) {
        this._waitingClear();
        while (this._loadingPage) {
            deasync.sleep(50);
        }

        return this._injectJquery().then(function() {
            console.log('Injected jquery');
            return results;
        });
    });
}

Page.prototype._waiting = [];
Page.prototype._waitLock = null;

Page.prototype._waitingPush = function (promiseFn) {
    this._waiting.push(promiseFn);
};

Page.prototype._waitingClear = function () {
    this._waiting.length = 0;
};

Page.prototype.wait = function() {
    if (this._waitLock !== null) {
        console.log('Hit waitLock');
        return this._waitLock;
    }

    console.log('Triggering each job');
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
