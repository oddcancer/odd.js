(function (odd) {
    var utils = {};

    utils.extendz = function () {
        var args = Array.prototype.slice.call(arguments, 0),
            dst = args[0];

        switch (utils.typeOf(dst)) {
            case 'null':
            case 'number':
            case 'string':
                throw { name: 'TypeError', message: 'Could not extend to type ' + utils.typeOf(dst) + '.' };
        }

        for (var i = 1; i < args.length; i++) {
            var arg = args[i];

            switch (utils.typeOf(arg)) {
                case 'null':
                case 'number':
                case 'string':
                    if (odd.debug) {
                        utils.warn('Could not extend from type ' + utils.typeOf(arg) + '.');
                    }
                    break;

                case 'array':
                    utils.forEach(arg, function (key, value) {
                        switch (utils.typeOf(value)) {
                            case 'object':
                                dst.push(utils.extendz({}, value));
                                break;

                            case 'array':
                                dst.push(utils.extendz([], value));
                                break;

                            default:
                                if (utils.typeOf(dst) === 'array') {
                                    dst.push(value);
                                } else {
                                    dst[key] = value;
                                }
                                break;
                        }
                    });
                    break;

                default:
                    utils.forEach(arg, function (key, value) {
                        switch (utils.typeOf(value)) {
                            case 'object':
                                switch (utils.typeOf(dst[key])) {
                                    case 'null':
                                    case 'number':
                                    case 'string':
                                        dst[key] = {};
                                        break;
                                }

                                dst[key] = utils.extendz(dst[key], value);
                                break;

                            case 'array':
                                dst[key] = utils.extendz([], value);
                                break;

                            default:
                                dst[key] = value;
                                break;
                        }
                    });
                    break;
            }
        }

        return dst;
    };

    utils.forEach = function (data, fn) {
        for (var key in data) {
            if (data.hasOwnProperty && utils.typeOf(data.hasOwnProperty) === 'function') {
                if (data.hasOwnProperty(key)) {
                    fn(key, data[key]);
                }
            } else {
                // IE8 has a problem looping through XML nodes
                fn(key, data[key]);
            }
        }
    };

    utils.getCookie = function (key) {
        var reg = new RegExp('(^| )' + key + '=([^;]*)(;|$)');
        var arr;
        if (arr = document.cookie.match(reg)) {
            return unescape(arr[2]);
        }

        return null;
    };

    utils.padStart = function (str, targetLength, padString) {
        str += '';
        while (str.length < targetLength) {
            str = padString + str;
        }

        return str;
    };

    utils.padEnd = function (str, targetLength, padString) {
        str += '';
        while (str.length < targetLength) {
            str = str + padString;
        }

        return str;
    };

    utils.hex = function (num) {
        return '0x' + utils.padStart(num.toString(16), 2, '0');
    };

    utils.date2utc = function (date) {
        var str = date.getUTCFullYear();
        str += '-' + utils.padStart(date.getUTCMonth() + 1, 2, '0');
        str += '-' + utils.padStart(date.getUTCDate(), 2, '0');
        str += ' ' + utils.padStart(date.getUTCHours(), 2, '0');
        str += ':' + utils.padStart(date.getUTCMinutes(), 2, '0');
        str += ':' + utils.padStart(date.getUTCSeconds(), 2, '0');
        return str;
    };

    utils.date2string = function (date) {
        var str = date.getFullYear();
        str += '-' + utils.padStart(date.getMonth() + 1, 2, '0');
        str += '-' + utils.padStart(date.getDate(), 2, '0');
        str += ' ' + utils.padStart(date.getHours(), 2, '0');
        str += ':' + utils.padStart(date.getMinutes(), 2, '0');
        str += ':' + utils.padStart(date.getSeconds(), 2, '0');
        return str;
    };

    utils.formatTime = function (sec) {
        var str = '';
        var h = sec / 3600 | 0;
        var m = (sec % 3600) / 60 | 0;
        var s = sec % 60 | 0;
        if (h) {
            str += utils.padStart(h, 2, '0') + ':';
        }
        str += utils.padStart(m, 2, '0') + ':' + utils.padStart(s, 2, '0');
        return str;
    };

    utils.formatBytes = function (n) {
        var units = ['B', 'KB', 'MB', 'GB', 'TB'];
        for (var i = 0; i < units.length; i++) {
            if (n < 1024 || i === units.length - 1) {
                return n.toFixed(3) + ' ' + units[i];
            }
            n /= 1024;
        }
        return n.toFixed(3) + ' B'; // Should not reach here.
    };

    utils.typeOf = function (value) {
        if (value === null || value === undefined) {
            return 'null';
        }

        var typeOfString = typeof value;
        if (typeOfString === 'object') {
            try {
                var str = Object.prototype.toString.call(value);
                var arr = str.match(/^\[object ([a-z]+)\]$/i);
                if (arr && arr.length > 1 && arr[1]) {
                    return arr[1].toLowerCase();
                }
            } catch (err) {
                /* void */
            }
        }

        return typeOfString;
    };

    utils.trim = function (str) {
        return str.replace(/^\s+|\s+$/g, '');
    };

    utils.indexOf = function (array, item) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === item) {
                return i;
            }
        }
        return -1;
    };

    utils.guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /* Number */
    if (Number.EPSILON === undefined) {
        Number.EPSILON = Math.pow(2, -52);
    }
    if (Number.MAX_SAFE_INTEGER === undefined) {
        Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
    }
    if (Number.MIN_SAFE_INTEGER === undefined) {
        Number.MIN_SAFE_INTEGER = -1 * Number.MAX_SAFE_INTEGER;
    }

    utils.equal = function (f0, f1) {
        return Math.abs(f0 - f1) < Number.EPSILON;
    };

    /* DOM */
    utils.createElement = function (name, className) {
        var newElement = document.createElement(name);
        if (className) {
            newElement.className = className;
        }

        return newElement;
    };

    utils.addClass = function (element, classes) {
        var originalClasses = utils.typeOf(element.className) === 'string' ? element.className.split(' ') : [];
        var addClasses = utils.typeOf(classes) === 'array' ? classes : classes.split(' ');

        utils.forEach(addClasses, function (i, name) {
            if (utils.indexOf(originalClasses, name) === -1) {
                originalClasses.push(name);
            }
        });

        element.className = utils.trim(originalClasses.join(' '));
    };

    utils.hasClass = function (element, classes) {
        var originalClasses = element.className || '';
        var hasClasses = utils.typeOf(classes) === 'array' ? classes : classes.split(' ');

        for (var i = 0; i < hasClasses.length; i++) {
            var re = new RegExp('\\b' + hasClasses[i] + '\\b', 'i');
            if (originalClasses.search(re) === -1) {
                return false;
            }
        }

        return true;
    };

    utils.removeClass = function (element, classes) {
        var originalClasses = utils.typeOf(element.className) === 'string' ? element.className.split(' ') : [];
        var removeClasses = utils.typeOf(classes) === 'array' ? classes : classes.split(' ');

        utils.forEach(removeClasses, function (n, c) {
            var index = utils.indexOf(originalClasses, c);
            if (index >= 0) {
                originalClasses.splice(index, 1);
            }
        });

        element.className = utils.trim(originalClasses.join(' '));
    };

    utils.reflow = function (element) {
        void element.offsetWidth;
    };

    utils.emptyElement = function (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };

    /* Logger */
    var console = window.console || {
        log: function () { },
        warn: function () { },
        error: function () { },
    };

    utils.debug = function () {
        if (odd.debug) {
            var args = Array.prototype.slice.call(arguments, 0);
            utils.log.apply(utils, args);
        }
    };

    utils.log = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof console === 'object') {
            console.log.apply(console, args);
        } else {
            console.log(args);
        }
    };

    utils.warn = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof console === 'object') {
            console.warn.apply(console, args);
        } else {
            console.warn(args);
        }
    };

    utils.error = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        if (typeof console === 'object') {
            console.error.apply(console, args);
        } else {
            console.error(args);
        }
    };

    odd.utils = utils;
})(odd);

