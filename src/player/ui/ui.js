(function (odd) {
    var utils = odd.utils,
        OS = odd.OS,
        css = utils.css,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        IOEvent = events.IOEvent,
        MediaEvent = events.MediaEvent,
        SaverEvent = events.SaverEvent,
        UIEvent = events.UIEvent,
        GlobalEvent = events.GlobalEvent,
        MouseEvent = events.MouseEvent,
        TimerEvent = events.TimerEvent,
        Player = odd.Player,

        CLASS_WRAPPER = 'pe-wrapper',
        CLASS_CONTENT = 'pe-content',

        _id = 0,
        _instances = {},
        _default = {
            aspectratio: '',         // deprecated! 16:9 etc.
            skin: 'classic',
            plugins: [],
        };

    function UI(id, option) {
        var _this = this,
            _logger = new utils.Logger(id, option),
            _plugins,
            _container,
            _wrapper,
            _content,
            _api,
            _timer;

        EventDispatcher.call(this, 'UI', { id: id, logger: _logger }, utils.extendz({}, Event, IOEvent, UIEvent));

        function _init() {
            _this.id = id;
            _this.logger = _logger;
            _plugins = {};
            _timer = new utils.Timer(3000, 1, _logger);
            _timer.addEventListener(TimerEvent.TIMER, _onTimer);
        }

        _this.setup = function (container, config) {
            _container = container;
            _parseConfig(config);

            _wrapper = utils.createElement('div', CLASS_WRAPPER + ' pe-ui-' + _this.config.skin);
            _content = utils.createElement('div', CLASS_CONTENT);
            _wrapper.appendChild(_content);
            _container.appendChild(_wrapper);

            _api = Player.get(_this.id, _logger);
            _api.addEventListener(Event.BIND, _onBind);
            _api.addEventListener(Event.READY, _onReady);
            _api.addEventListener(Event.PLAY, _onStateChange);
            _api.addEventListener(Event.WAITING, _onStateChange);
            _api.addEventListener(IOEvent.LOADSTART, _this.forward);
            _api.addEventListener(IOEvent.OPEN, _this.forward);
            _api.addEventListener(IOEvent.PROGRESS, _this.forward);
            _api.addEventListener(IOEvent.SUSPEND, _this.forward);
            _api.addEventListener(IOEvent.STALLED, _this.forward);
            _api.addEventListener(IOEvent.ABORT, _this.forward);
            _api.addEventListener(IOEvent.TIMEOUT, _this.forward);
            _api.addEventListener(Event.DURATIONCHANGE, _onDurationChange);
            _api.addEventListener(Event.LOADEDMETADATA, _this.forward);
            _api.addEventListener(Event.LOADEDDATA, _this.forward);
            _api.addEventListener(Event.CANPLAY, _this.forward);
            _api.addEventListener(Event.PLAYING, _onStateChange);
            _api.addEventListener(Event.CANPLAYTHROUGH, _this.forward);
            _api.addEventListener(Event.PAUSE, _onStateChange);
            _api.addEventListener(Event.SEEKING, _onStateChange);
            _api.addEventListener(Event.SEEKED, _this.forward);
            _api.addEventListener(Event.SWITCHING, _onSwitching);
            _api.addEventListener(Event.SWITCHED, _this.forward);
            _api.addEventListener(Event.RATECHANGE, _this.forward);
            _api.addEventListener(Event.TIMEUPDATE, _onTimeUpdate);
            _api.addEventListener(Event.VOLUMECHANGE, _onVolumeChange);
            _api.addEventListener(IOEvent.LOAD, _this.forward);
            _api.addEventListener(IOEvent.LOADEND, _this.forward);
            _api.addEventListener(MediaEvent.INFOCHANGE, _onInfoChange);
            _api.addEventListener(MediaEvent.STATSUPDATE, _onStatsUpdate);
            _api.addEventListener(MediaEvent.SEI, _this.forward);
            _api.addEventListener(MediaEvent.SCREENSHOT, _this.forward);
            _api.addEventListener(SaverEvent.WRITERSTART, _onWriterStart);
            _api.addEventListener(SaverEvent.WRITEREND, _onWriterEnd);
            _api.addEventListener(Event.ENDED, _onStateChange);
            _api.addEventListener(Event.ERROR, _onError);
            _api.setup(_content, _this.config);

            _buildPlugins();
            _setupPlugins();
            _this.resize();
        };

        function _parseConfig(config) {
            if (utils.typeOf(config.plugins) !== 'array') {
                config.plugins = [];
            }

            var plugins = [];
            for (var i = 0; i < _default.plugins.length; i++) {
                var plugin = _default.plugins[i];
                var def = plugin.prototype.CONF;
                var cfg = (function (kind) {
                    for (var j = 0; j < config.plugins.length; j++) {
                        var item = config.plugins[j];
                        if (item.kind === kind) {
                            return item;
                        }
                    }
                    return null;
                })(plugin.prototype.kind);
                plugins.push(utils.extendz({}, def, cfg));
            }

            _this.config = utils.extendz({ id: _this.id }, Player.prototype.CONF, _default, config);
            _this.config.plugins = plugins;
        }

        function _buildPlugins() {
            utils.forEach(_this.config.plugins, function (i, config) {
                if (utils.typeOf(UI[config.kind]) !== 'function') {
                    _logger.error('Unrecognized plugin: index=' + i + ', kind=' + config.kind + '.');
                    return;
                }
                if (config.visibility === false) {
                    _logger.log('Component ' + config.kind + ' is disabled.');
                    return;
                }
                if (config.kind === 'Controlbar' && !_this.config.file) {
                    config.sources = _this.config.sources;
                }

                try {
                    var plugin = new UI[config.kind](config, _logger);
                    if (utils.typeOf(plugin.addGlobalListener) === 'function') {
                        plugin.addGlobalListener(_onPluginEvent);
                    }
                    _wrapper.appendChild(plugin.element());
                    _plugins[config.kind] = plugin;
                } catch (err) {
                    _logger.error('Failed to initialize plugin: index=' + i + ', kind=' + config.kind + '. Error=' + err.message);
                }
            });
        }

        function _setupPlugins() {
            _wrapper.setAttribute('mode', _this.config.mode);
            _wrapper.setAttribute('state', '');

            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                _wrapper.setAttribute('controls', controlbar.config.autohide ? 'motion' : 'always');
                if (controlbar.config.autohide) {
                    _wrapper.addEventListener('mousemove', _onMouseMove);
                }
            } else {
                _wrapper.setAttribute('controls', 'never');
            }

            var danmu = _plugins['Danmu'];
            if (danmu) {
                _wrapper.setAttribute('danmu', danmu.config.enable ? 'on' : 'off');
            }

            _wrapper.setAttribute('muted', _this.config.muted);
            _wrapper.setAttribute('fullpage', false);
            _wrapper.setAttribute('fullscreen', false);

            var contextmenu = _plugins['ContextMenu'];
            if (contextmenu) {
                _wrapper.oncontextmenu = function (e) {
                    e = e || window.event;
                    e.preventDefault ? e.preventDefault() : e.returnValue = false;
                    return false;
                };
                document.addEventListener('mouseup', _onMouseUp);
                _wrapper.addEventListener('mouseup', _onMouseUp);
                document.addEventListener('mousedown', _onMouseDown);
                _wrapper.addEventListener('mousedown', _onMouseDown);
            }

            document.addEventListener('fullscreenchange', _onFullscreenChange);
            document.addEventListener('webkitfullscreenchange', _onFullscreenChange);
            document.addEventListener('mozfullscreenchange', _onFullscreenChange);
            document.addEventListener('MSFullscreenChange', _onFullscreenChange);
        }

        function _onBind(e) {
            _this.config = _api.config;
            _this.play = _api.play;
            _this.pause = _api.pause;
            _this.seek = _api.seek;
            _this.stop = _api.stop;
            _this.reload = _api.reload;
            _this.muted = _api.muted;
            _this.volume = _api.volume;
            _this.definition = _api.definition;
            _this.capture = _api.capture;
            _this.record = _api.record;
            _this.element = _api.element;
            _this.getProperty = _api.getProperty;
            _this.duration = _api.duration;
            _this.state = _api.state;
            _this.forward(e);
        }

        _this.danmu = function (enable) {
            _wrapper.setAttribute('danmu', enable ? 'on' : 'off');
            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                controlbar.resize(_content.clientWidth, _content.clientHeight);
            }
            var danmu = _plugins['Danmu'];
            if (danmu) {
                return danmu.enable(enable);
            }
            return false;
        };

        _this.shoot = function (text, data) {
            var danmu = _plugins['Danmu'];
            if (danmu) {
                danmu.shoot(text, data);
                _this.dispatchEvent(UIEvent.SHOOTING, { text: text, data: data });
            }
        };

        _this.displayAD = function (element) {
            var ad = _plugins['AD'];
            if (ad) {
                ad.display(element);
            }
        };

        _this.removeAD = function () {
            var ad = _plugins['AD'];
            if (ad) {
                ad.remove();
            }
        };

        _this.fullpage = function (status) {
            if (status === undefined) {
                return _wrapper.getAttribute('fullpage') === 'true';
            }

            var fullscreenElement = document.fullscreenElement
                || document.webkitFullscreenElement
                || document.mozFullScreenElement
                || document.msFullscreenElement;
            if (fullscreenElement) {
                _this.fullscreen(false);
            }

            _wrapper.setAttribute('fullpage', !!status);
            _this.resize();
            _this.dispatchEvent(UIEvent.FULLPAGE, { status: status });
        };

        _this.fullscreen = function (status) {
            if (status === undefined) {
                return _wrapper.getAttribute('fullscreen') === 'true';
            }

            var video = _api.element();
            if (!!status) {
                var requestFullscreen = _wrapper.requestFullscreen
                    || _wrapper.webkitRequestFullScreen
                    || _wrapper.mozRequestFullScreen
                    || _wrapper.msRequestFullscreen; // IE 11, Edge
                if (OS.isMobile) {
                    if (video && video.webkitEnterFullscreen) {
                        video.setAttribute('x5-video-orientation', 'landscape');
                        video.webkitEnterFullscreen();
                    }
                    if (OS.isIOS) {
                        // TODO(spencer-lau): Need to double check.
                        return;
                    }
                } else if (requestFullscreen) {
                    var promise = requestFullscreen.call(_wrapper);
                    if (promise) {
                        promise['catch'](function (err) {
                            _logger.debug(err.name + ': ' + err.message);
                        });
                    }
                } else {
                    // IE 9/10
                    _this.fullpage(status);
                    return;
                }
            } else {
                var exitFullscreen = document.exitFullscreen
                    || document.webkitCancelFullScreen
                    || document.mozCancelFullScreen
                    || document.msExitFullscreen;
                if (exitFullscreen) {
                    if (video) {
                        video.setAttribute('x5-video-orientation', 'portraint');
                    }
                    var promise = exitFullscreen.call(document);
                    if (promise) {
                        promise['catch'](function (err) {
                            _logger.debug(err.name + ': ' + err.message);
                        });
                    }
                } else {
                    _this.fullpage(status);
                    return;
                }
            }

            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                css.style(controlbar.element(), {
                    'visibility': 'visible',
                });

                if (!!status) {
                    if (!controlbar.config.autohide) {
                        _wrapper.setAttribute('controls', 'motion');
                        _wrapper.addEventListener('mousemove', _onMouseMove);
                    }
                } else {
                    if (!controlbar.config.autohide) {
                        _wrapper.setAttribute('controls', 'always');
                        _wrapper.removeEventListener('mousemove', _onMouseMove);
                        _timer.stop();
                    }
                }
            }

            _wrapper.setAttribute('fullscreen', !!status);
            _this.resize();
            _this.dispatchEvent(UIEvent.FULLSCREEN, { status: status });
        };

        function _onFullscreenChange(e) {
            var fullscreenElement = document.fullscreenElement
                || document.webkitFullscreenElement
                || document.mozFullScreenElement
                || document.msFullscreenElement;
            // Deal with ESC key pressed.
            if (!fullscreenElement) {
                _this.fullscreen(false);
            }
        }

        function _onPluginEvent(e) {
            switch (e.type) {
                case GlobalEvent.CHANGE:
                    _onChange(e);
                    break;
                case MouseEvent.CLICK:
                    _onClick(e);
                    break;
                case MouseEvent.DOUBLE_CLICK:
                    _onDoubleClick(e);
                    break;
                default:
                    _this.forward(e);
                    break;
            }
        }

        function _onChange(e) {
            var h = {
                'timebar': function () {
                    var duration = _api.duration();
                    if (duration) {
                        _api.seek(duration * e.data.value / 100);
                    }
                },
                'volumebar': function () {
                    _api.volume(e.data.value / 100);
                },
                'definition': function () {
                    _api.definition(parseInt(e.data.value));
                },
            }[e.data.name];
            if (h) {
                h();
            } else {
                _this.forward(e);
            }
        }

        function _onClick(e) {
            var h = {
                'play': _this.play,
                'pause': _this.pause,
                'stop': _this.stop,
                'reload': _this.reload,
                'capture': _this.capture,
                'download': function () { _this.record('fragmented.mp4'); },
                'mute': function () { _this.muted(true); },
                'unmute': function () { _this.muted(false); },
                'danmuoff': function () { _this.danmu(false); },
                'danmuon': function () { _this.danmu(true); },
                'fullpage': function () { _this.fullpage(true); },
                'exitfullpage': function () { _this.fullpage(false); },
                'fullscreen': function () { _this.fullscreen(true); },
                'exitfullscreen': function () { _this.fullscreen(false); },
                'info': function () { _showPanel(e.data.name); },
                'stats': function () { _showPanel(e.data.name); },
            }[e.data.name];
            if (h) {
                h();
            } else {
                _this.forward(e);
            }
        }

        function _onDoubleClick(e) {
            var h = {
                'fullpage': function () { _this.fullpage(_wrapper.getAttribute('fullpage') !== 'true'); },
                'fullscreen': function () { _this.fullscreen(_wrapper.getAttribute('fullscreen') !== 'true'); },
            }[e.data.name];
            if (h) {
                h();
            } else {
                _this.forward(e);
            }
        }

        function _onMouseMove(e) {
            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                css.style(controlbar.element(), {
                    'visibility': 'visible',
                });
            }

            _timer.stop();
            _timer.start();
        }

        function _onTimer(e) {
            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                css.style(controlbar.element(), {
                    'visibility': 'hidden',
                });
            }
        }

        function _onMouseUp(e) {
            var contextmenu = _plugins['ContextMenu'];

            if (e.currentTarget === undefined) {
                for (var node = e.srcElement; node; node = node.offsetParent) {
                    if (node === _wrapper) {
                        e.currentTarget = _wrapper;
                        break;
                    }
                }
            }

            if (e.button === 2 && e.currentTarget === _wrapper) {
                var offsetX = 0;
                var offsetY = 0;

                for (var node = e.srcElement || e.target; node && node !== _wrapper; node = node.offsetParent) {
                    offsetX += node.offsetLeft;
                    offsetY += node.offsetTop;
                }

                css.style(contextmenu.element(), {
                    left: e.offsetX + offsetX + 'px',
                    top: e.offsetY + offsetY + 'px',
                    display: 'block',
                });

                e.preventDefault ? e.preventDefault() : e.returnValue = false;
                e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
                return false;
            }
        }

        function _onMouseDown(e) {
            var contextmenu = _plugins['ContextMenu'];
            css.style(contextmenu.element(), {
                'display': 'none',
            });
        }

        function _onReady(e) {
            _onStateChange(e);
        }

        function _onDurationChange(e) {
            _wrapper.setAttribute('mode', _this.config.mode);
            _this.forward(e);
        }

        function _onSwitching(e) {
            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                var definition = controlbar.components['definition'];
                if (definition) {
                    definition.value(e.data.index);
                }
            }

            _onStateChange(e);
        }

        function _onTimeUpdate(e) {
            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                var timebar = controlbar.components['timebar'];
                if (timebar) {
                    timebar.duration = e.data.duration;
                    timebar.progress(isNaN(e.data.duration) ? 0 : e.data.buffered / e.data.duration * 100);
                    timebar.position(isNaN(e.data.duration) ? 0 : e.data.time / e.data.duration * 100);
                }
                var time = controlbar.components['time'];
                if (time) {
                    var t = utils.formatTime(e.data.time);
                    var d = utils.formatTime(e.data.duration);
                    time.text(t + '/' + d);
                }
            }

            var display = _plugins['Display'];
            if (display) {
                display.update('stats', {
                    TimeStart: utils.formatTime(e.data.start),
                    TimeEnd: utils.formatTime(e.data.buffered),
                    Time: utils.formatTime(e.data.time),
                    BufferLength: (e.data.buffered - e.data.time).toLocaleString() + ' sec.',
                });
            }

            _this.forward(e);
        }

        function _onVolumeChange(e) {
            var n = e.data.volume * 100 | 0;
            _wrapper.setAttribute('muted', e.data.muted || !n);

            var controlbar = _plugins['Controlbar'];
            if (controlbar) {
                controlbar.resize(_content.clientWidth, _content.clientHeight);

                var volumebar = controlbar.components['volumebar'];
                if (volumebar) {
                    volumebar.position(n);
                    volumebar.thumb(n);
                }
            }

            _this.forward(e);
        }

        function _onInfoChange(e) {
            var display = _plugins['Display'];
            if (display) {
                display.update('info', e.data.info);
            }

            _this.forward(e);
        }

        function _onStatsUpdate(e) {
            var display = _plugins['Display'];
            if (display) {
                var data = utils.extendz({}, e.data.stats);
                utils.forEach(data, function (key, value) {
                    switch (key) {
                        case 'BytesReceived':
                        case 'BytesReceivedPerSecond':
                            data[key] = utils.formatBytes(value);
                            break;
                        case 'AudioPacketsReceivedPerSecond':
                        case 'VideoPacketsReceivedPerSecond':
                        case 'DroppedVideoFrames':
                        case 'TotalVideoFrames':
                            data[key] = value.toLocaleString();
                            break;
                        case 'FirstAudioFrameReceivedIn':
                        case 'FirstVideoFrameReceivedIn':
                            data[key] = value.toLocaleString() + ' ms.';
                            break;
                    }
                });
                display.update('stats', data);
            }

            _this.forward(e);
        }

        function _onWriterStart(e) {
            // TODO(spencer-lau): Download button
            _this.forward(e);
        }

        function _onWriterEnd(e) {
            // TODO(spencer-lau): Download button
            _this.forward(e);
        }

        function _showPanel(name) {
            var display = _plugins['Display'];
            if (display) {
                display.show(name);
            }
        }

        function _onError(e) {
            if (!(function () {
                switch (e.data.name) {
                    case 'SecurityError':
                        if (e.data.message.indexOf('toDataURL') !== -1) {
                            return false;
                        }
                        break;
                }
                return true;
            })()) {
                _this.forward(e);
                return;
            }

            var display = _plugins['Display'];
            if (display) {
                display.error(e.data);
            }

            e.type = Event.ERROR;
            _onStateChange(e);
            _this.stop();
        }

        function _onStateChange(e) {
            _wrapper.setAttribute('state', e.type);

            var display = _plugins['Display'];
            if (display) {
                display.state(e.type);
            }

            _this.resize();
            _this.forward(e);
        }

        _this.resize = function () {
            var width = _content.clientWidth;
            var height = _content.clientHeight;
            if (_this.config.aspectratio !== '') {
                var arr = _this.config.aspectratio.match(/(\d+)\:(\d+)/);
                if (utils.typeOf(arr) === 'array' && arr.length > 2) {
                    var w = parseInt(arr[1]);
                    var h = parseInt(arr[2]);
                    height = width * h / w;
                    if (_wrapper.getAttribute('controls') === 'always') {
                        height -= 40;
                    }
                }
            }

            utils.forEach(_plugins, function (kind, plugin) {
                plugin.resize(width, height);
            });

            _this.dispatchEvent(UIEvent.RESIZE, { width: width, height: height });
        };

        _this.destroy = function () {
            _timer.stop();
            _timer.removeEventListener(TimerEvent.TIMER, _onTimer);
            if (_api) {
                _api.destroy();
                _api.removeEventListener(Event.BIND, _onBind);
                _api.removeEventListener(Event.READY, _onReady);
                _api.removeEventListener(Event.PLAY, _onStateChange);
                _api.removeEventListener(Event.WAITING, _onStateChange);
                _api.removeEventListener(IOEvent.LOADSTART, _this.forward);
                _api.removeEventListener(IOEvent.OPEN, _this.forward);
                _api.removeEventListener(IOEvent.PROGRESS, _this.forward);
                _api.removeEventListener(IOEvent.SUSPEND, _this.forward);
                _api.removeEventListener(IOEvent.STALLED, _this.forward);
                _api.removeEventListener(IOEvent.ABORT, _this.forward);
                _api.removeEventListener(IOEvent.TIMEOUT, _this.forward);
                _api.removeEventListener(Event.DURATIONCHANGE, _onDurationChange);
                _api.removeEventListener(Event.LOADEDMETADATA, _this.forward);
                _api.removeEventListener(Event.LOADEDDATA, _this.forward);
                _api.removeEventListener(Event.CANPLAY, _this.forward);
                _api.removeEventListener(Event.PLAYING, _onStateChange);
                _api.removeEventListener(Event.CANPLAYTHROUGH, _this.forward);
                _api.removeEventListener(Event.PAUSE, _onStateChange);
                _api.removeEventListener(Event.SEEKING, _onStateChange);
                _api.removeEventListener(Event.SEEKED, _this.forward);
                _api.removeEventListener(Event.SWITCHING, _onSwitching);
                _api.removeEventListener(Event.SWITCHED, _this.forward);
                _api.removeEventListener(Event.RATECHANGE, _this.forward);
                _api.removeEventListener(Event.TIMEUPDATE, _onTimeUpdate);
                _api.removeEventListener(Event.VOLUMECHANGE, _onVolumeChange);
                _api.removeEventListener(IOEvent.LOAD, _this.forward);
                _api.removeEventListener(MediaEvent.INFOCHANGE, _onInfoChange);
                _api.removeEventListener(MediaEvent.STATSUPDATE, _onStatsUpdate);
                _api.removeEventListener(MediaEvent.SCREENSHOT, _this.forward);
                _api.removeEventListener(Event.ENDED, _onStateChange);
                _api.removeEventListener(Event.ERROR, _onError);
                _api = undefined;
                _container.innerHTML = '';
            }
            delete _instances[_this.id];
        };

        _init();
    }

    UI.prototype = Object.create(EventDispatcher.prototype);
    UI.prototype.constructor = UI;
    UI.prototype.CONF = _default;

    UI.register = function (plugin, index) {
        try {
            _default.plugins.splice(index || _default.plugins.length, 0, plugin);
            UI[plugin.prototype.kind] = plugin;
        } catch (err) {
            _logger.error('Failed to register plugin ' + plugin.prototype.kind + ', Error=' + err.message);
        }
    };

    UI.get = function (id, option) {
        if (id == null) {
            id = 0;
        }

        var ui = _instances[id];
        if (ui === undefined) {
            ui = new UI(id, option);
            _instances[id] = ui;
        }

        return ui;
    };

    UI.create = function (option) {
        return UI.get(_id++, option);
    };

    odd.player.ui = UI.get;
    odd.player.ui.create = UI.create;
    Player.UI = UI;
})(odd);

