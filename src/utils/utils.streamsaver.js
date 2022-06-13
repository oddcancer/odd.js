(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        SaverEvent = events.SaverEvent,

        WriterState = {
            INIT: 'init',
            START: 'start',
            END: 'end',
        },
        _default = {
            script: 'js/sw.js',
            scope: 'js/',
            enable: false,
        };

    function StreamWriter(filename, writer, logger) {
        EventDispatcher.call(this, 'StreamWriter', { logger: logger }, [SaverEvent.WRITERSTART, SaverEvent.WRITEREND]);

        var _this = this,
            _logger = logger,
            _writer;

        function _init() {
            _this.filename = filename;
            _this.readyState = WriterState.INIT;
            _writer = writer;
            _writer.closed.then(function () {
                _logger.log('StreamWriter.closed: ' + _this.filename);
                _this.close();
            });
        }

        // Should be called once the first keyframe is detected.
        _this.start = function () {
            if (_this.readyState === WriterState.INIT) {
                _this.readyState = WriterState.START;
                _this.dispatchEvent(SaverEvent.WRITERSTART);
            }
        };

        _this.write = function (chunk) {
            if (_this.readyState === WriterState.START) {
                _writer.write(chunk).catch(function (err) {
                    _logger.error('StreamWriter failed to write: ' + err);
                });
            }
        };

        _this.close = function () {
            switch (_this.readyState) {
                case WriterState.INIT:
                case WriterState.START:
                    _this.readyState = WriterState.END;
                    _writer.close();
                    _this.dispatchEvent(SaverEvent.WRITEREND);
                    break;
            }
        };

        _init();
    }

    function StreamSaver(config, logger) {
        EventDispatcher.call(this, 'StreamSaver', { logger: logger }, [Event.ERROR], SaverEvent);

        var _this = this,
            _logger = logger,
            _writers,
            _registration,
            _sw;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _writers = {};

            window.addEventListener('beforeunload', _onBeforeUnload);
        }

        function _onBeforeUnload(e) {
            utils.forEach(_writers, function (filename, writer) {
                writer.close();
            });
        }

        _this.register = function () {
            if (!navigator.serviceWorker) {
                return Promise.reject({ name: 'NotSupportedError', message: 'The operation is not supported.' });
            }
            return navigator.serviceWorker.getRegistration(_this.config.scope).then(function (registration) {
                return registration || navigator.serviceWorker.register(_this.config.script, { scope: _this.config.scope });
            }).then(function (registration) {
                _logger.log('Registered ServiceWorkerRegistration: ' + registration.scope);
                _registration = registration;
                _sw = registration.installing || registration.waiting || registration.active;
                _sw.addEventListener('statechange', function (e) {
                    _logger.log('ServiceWorker.state: ' + _sw.state);
                });
            }).catch(function (err) {
                _logger.error('Failed to register ServiceWorkerRegistration: ' + err);
            });
        };

        _this.record = function (filename) {
            if (!window.TransformStream) {
                _this.dispatchEvent(Event.ERROR, { name: 'NotSupportedError', message: 'Not supportped.' });
                return null;
            }
            if (!filename) {
                _this.dispatchEvent(Event.ERROR, { name: 'AbortError', message: 'The operation was aborted.' });
                return null;
            }
            if (_writers.hasOwnProperty(filename)) {
                return _writers[filename];
            }

            var ts = new TransformStream();
            var channel = new MessageChannel();
            channel.port1.onmessage = _onMessage;
            channel.port1.postMessage({ stream: ts.readable }, [ts.readable]);

            var writer = new StreamWriter(filename, ts.writable.getWriter(), _logger);
            writer.addEventListener(SaverEvent.WRITERSTART, _this.forward);
            writer.addEventListener(SaverEvent.WRITEREND, _onWriterEnd);
            _writers[filename] = writer;

            _sw.postMessage({
                operation: 'recordstart',
                filename: filename,
                version: odd().version,
            }, [channel.port2]);
            return writer;
        };

        function _onMessage(e) {
            _logger.log('ServiceWorker: event=' + e.data.event + ', filename=' + e.data.filename);
            switch (e.data.event) {
                case 'recordstart':
                    if (StreamSaver.prototype.isSupported(e.data.version) === false) {
                        _logger.warn('ServiceWorker upgrading...');
                        _this.unregister();
                        _this.register(e.data.filename);
                        break;
                    }
                    var iframe = document.createElement('iframe');
                    iframe.hidden = true;
                    iframe.src = _this.config.scope + e.data.filename;
                    document.body.appendChild(iframe);
                    break;

                case 'loadstart':
                    // Do nothing here.
                    break;

                case 'error':
                    _logger.warn(e.data.name + ': ' + e.data.message);
                    _this.unregister(true);
                    _this.dispatchEvent(Event.ERROR, {
                        name: e.data.name,
                        message: e.data.message,
                        filename: e.data.filename,
                        version: e.data.version,
                    });
                    break;
            }
        }

        function _onWriterEnd(e) {
            var writer = e.target;
            writer.removeEventListener(SaverEvent.WRITERSTART, _this.forward);
            writer.removeEventListener(SaverEvent.WRITEREND, _onWriterEnd);
            delete _writers[writer.filename];

            _sw.postMessage({
                operation: 'recordend',
                filename: writer.filename,
                version: odd().version,
            });
            _this.forward(e);
        }

        _this.unregister = function (outdated) {
            if (!outdated && _registration) {
                _registration.unregister();
                _this.dispatchEvent(SaverEvent.UNRIGISTER);
            }
            utils.forEach(_writers, function (filename, writer) {
                writer.close();
            });
            _registration = undefined;
            _sw = undefined;
        };

        _init();
    }

    StreamSaver.prototype.CONF = _default;

    StreamSaver.prototype.isSupported = function (version) {
        var minimum = '2.3.24';
        var reg = /^(\d+)\.(\d+)\.(\d+)$/;
        var min = minimum.match(reg);
        var ver = version.match(reg);
        var v = '';
        var m = '';
        for (var i = 1; i < ver.length; i++) {
            var n = Math.max(ver[i].length, min[i].length);
            v += utils.padStart(ver[i], n, '0');
            m += utils.padStart(min[i], n, '0');
        }
        return v >= m;
    };

    StreamWriter.WriterState = WriterState;
    utils.StreamWriter = StreamWriter;
    utils.StreamSaver = StreamSaver;
})(odd);

