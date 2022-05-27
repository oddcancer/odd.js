(function (odd) {
    var utils = odd.utils,
        OS = odd.OS,
        Kernel = odd.Kernel,
        Browser = odd.Browser,
        FileSaver = utils.FileSaver,

        Level = {
            DEBUG: 0x00,
            LOG: 0x10,
            WARN: 0x20,
            ERROR: 0x40,
        },
        Prefix = {
            0x00: '[DEBUG]',
            0x10: '[L O G]',
            0x20: '[WARN ]',
            0x40: '[ERROR]',
        },
        Mode = {
            CONSOLE: 0x00,
            FILE: 0x01,
            FEEDBACK: 0x02,
        },
        _default = {
            level: 'log',    // debug, log, warn, error
            mode: 'console', // console, file, feedback
            url: '',
            interval: 60,
        };

    function getLevel(level) {
        return {
            debug: Level.DEBUG,
            log: Level.LOG,
            warn: Level.WARN,
            error: Level.ERROR,
        }[level];
    }

    function getMode(mode) {
        return {
            console: Mode.CONSOLE,
            file: Mode.FILE,
            feedback: Mode.FEEDBACK,
        }[mode];
    }

    function Logger(id, config) {
        var _this = this,
            _prefix,
            _lines,
            _saver,
            _xhr;

        function _init() {
            _this.id = id;
            _this.config = utils.extendz({ id: _this.id }, _default, config);
            _this.config.level = getLevel(_this.config.level);
            _this.config.mode = getMode(_this.config.mode);

            _prefix = '[' + utils.padStart(_this.id, 2, '0') + ']';
            _lines = [];

            odd.debug = _this.config.level === Level.DEBUG;
            switch (_this.config.mode) {
                case Mode.FILE:
                    _saver = new FileSaver({ filename: 'odd.log', type: 'text/plain' });
                    break;
                case Mode.FEEDBACK:
                    _xhr = new XMLHttpRequest();
                    _xhr.onload = _onLoad;
                    _xhr.onerror = _onError;
                    _xhr.responseType = 'text';
                    break;
            }

            _this.append(Level.LOG, ['Version: odd.js/' + odd().version]);
            _this.append(Level.LOG, ['OS:      ' + OS.name + '/' + OS.version + (OS.model ? '; ' + OS.model : '')]);
            _this.append(Level.LOG, ['Kernel:  ' + Kernel.name + '/' + Kernel.version]);
            _this.append(Level.LOG, ['Browser: ' + Browser.name + '/' + Browser.version]);
        }

        _this.debug = function () {
            if (_this.config.level <= Level.DEBUG) {
                var args = Array.prototype.slice.call(arguments, 0);
                utils.debug.apply(utils, [_prefix].concat(args));
                _this.append(Level.DEBUG, args);
            }
        };

        _this.log = function () {
            if (_this.config.level <= Level.LOG) {
                var args = Array.prototype.slice.call(arguments, 0);
                utils.log.apply(utils, [_prefix].concat(args));
                _this.append(Level.LOG, args);
            }
        };

        _this.warn = function () {
            if (_this.config.level <= Level.WARN) {
                var args = Array.prototype.slice.call(arguments, 0);
                utils.warn.apply(utils, [_prefix].concat(args));
                _this.append(Level.WARN, args);
            }
        };

        _this.error = function () {
            if (_this.config.level <= Level.ERROR) {
                var args = Array.prototype.slice.call(arguments, 0);
                utils.error.apply(utils, [_prefix].concat(args));
                _this.append(Level.ERROR, args);
            }
        };

        _this.append = function (level, args) {
            if (_this.config.mode >= Mode.FILE) {
                var line = _getLine(level, args);
                _lines.push(line);
            }
        };

        function _getLine(level, args) {
            var line = utils.date2string(new Date()) + ' ' + Prefix[level];
            utils.forEach(args, function (i, item) {
                switch (utils.typeOf(item)) {
                    case 'object':
                        line += ' ' + JSON.stringify(item);
                        break;
                    default:
                        line += ' ' + item;
                        break;
                }
            });
            return line;
        }

        _this.flush = function () {
            if (_lines.length) {
                switch (_this.config.mode) {
                    case Mode.FILE:
                        var date = new Date();
                        var time = date.getFullYear() +
                            utils.padStart(date.getMonth() + 1, 2, '0') +
                            utils.padStart(date.getDate(), 2, '0') + '-' +
                            utils.padStart(date.getHours(), 2, '0') +
                            utils.padStart(date.getMinutes(), 2, '0') +
                            utils.padStart(date.getSeconds(), 2, '0') + '.' +
                            utils.padStart(date.getMilliseconds(), 3, '0');
                        utils.forEach(_lines, function (i, line) {
                            _saver.append(line + '\n');
                        });
                        _saver.save('odd-' + time + '.log');
                        break;

                    case Mode.FEEDBACK:
                        _xhr.open('POST', _this.config.url, true);
                        _xhr.send(JSON.stringify(_lines));
                        break;
                }
                _lines = [];
            }
        };

        function _onLoad(e) {
            utils.debug('Feedback success.');
        }

        function _onError(err) {
            utils.error('Failed to feedback: name=NetworkError.');
        }

        _init();
    }

    Logger.prototype.CONF = _default;

    Logger.Level = Level;
    Logger.Prefix = Prefix;
    Logger.Mode = Mode;
    utils.Logger = Logger;
})(odd);

