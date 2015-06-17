'use strict';

var path = require('path');
var Promise = require('bluebird');
var deasync = require('deasync');
var util = require('./util');
const EVENT_KEYS = require('./util/eventKeys');
const JQUERY_PATH = path.join(__dirname, './util/jquery.js');

function Page(phPage, opts) {
    phPage.evaluateAsync = null;
    this._page = Promise.promisifyAll(phPage);

    this._page.onLoadStarted = function() {
        util.debug('Triggered load started');
        this._loadingPage = true;
    }.bind(this);

    this._page.onUrlChanged = function() {
        util.debug('Triggered url change');
        this._loadingPage = true;
    }.bind(this);

    this._page.onLoadFinished = function(status) {
        util.debug('Triggered load finished');
        this._loadingPage = false;
    }.bind(this);

    this._opts = opts || {};
    this._opts.viewportSize = this._opts.viewportSize || {
        width: 800,
        height: 600
    };

    // TODO: fix this
    var settingsOptsDone = false;
    this.set(this._opts).then(function() {
        settingsOptsDone = true;
    }, function (err) {
        settingsOptsDone = true;
        console.error(err);
        process.exit();
    });

    // while (!settingsOptsDone) {
    //     // util.debug(33);
    //     deasync.runLoopOnce();
    // }
};
module.exports = Page;

Page.prototype.EVENT_KEYS = EVENT_KEYS;

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

        return Promise.resolve(Object.keys(opts)).bind(this).each(function(name) {
            return this.set(name, opts[name]);
        });
    }

    return Promise.resolve();
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
        return !!$(selector).length &&
            $(selector)[0].getBoundingClientRect();
    }, selector);
};

Page.prototype.click = function(selector) {
    // TODO: arguments for hardcoded +3
    var promiseFn = function() {
        // return this._getOffset(selector).then(function(offset) {
        //     util.debug(offset);
        //     if (offset) {
        //         return this._page.sendEvent('click', offset.left + 6, offset.top + 3);
        //     } else {
        //         throw new Error('Selector ' + selector + ' not found on click');
        //     }
        // });
        return this.evaluate(function(selector) {
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);

            return !!$(selector).length &&
                !!$(selector)[0].dispatchEvent(evt);
        }, selector).then(function(result) {
            util.debug(result);
            if (result) {
                return result;
            } else {
                throw new Error('Selector ' + selector + ' not found on click');
            }
        });
    }.bind(this);

    this._waitingPush(promiseFn);
};

//TODO: why doesn't it work
// Page.prototype.blur = function(selector) {
//     return this.evaluate(function(selector) {
//         $(selector).blur();
//     }, selector);
// };

Page.prototype.focus = function(selector) {
    return this.evaluate(function(selector) {
        return !!$(selector).length &&
            !!$(selector).focus();
    }, selector).then(function(result) {
        util.debug(result);
        if (result) {
            return result;
        } else {
            throw new Error('Selector ' + selector + ' not found on focus');
        }
    });
};

/**
* delay - delay between writing letters {default: 80}
*/
Page.prototype.type = function(selector, text, delay) {
    delay = delay || 80;
    var promiseFn = function() {
        return this.focus(selector).then(function() {
            text = String(text);
            for (var i = 0; i < text.length; i++) {
                this._page.sendEvent('keypress', text[i]);
                deasync.sleep(delay);
            }
        });
    }.bind(this);

    this._waitingPush(promiseFn);
};

Page.prototype.render = function(file, selector) {
    if (selector) {
        return this._getOffset(selector).then(function(offset) {
            if (offset) {
                return this.set('clipRect', offset);
            } else {
                throw new Error('Couldn\'t find ' + selector + ' on render');
            }
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

        let timedout;
        setTimeout(function() {
            if (this._loadingPage) {
                timedout = true;
            }
        }.bind(this), 12 * 1000);
        // TODO: timeout limit in constructor

        while (this._loadingPage && !timedout) {
            deasync.sleep(50);
        }

        if (timedout) {
            throw new Error('Timedout on ' + selector);
        }

        return this._injectJquery().then(function() {
            util.debug('Injected jQuery');
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
        util.debug('Hit waitLock');
        return this._waitLock;
    }

    util.debug('Triggering each job');
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
