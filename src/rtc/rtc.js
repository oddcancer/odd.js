(function (odd) {
    var utils = odd.utils,
        Logger = utils.Logger,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        TimerEvent = events.TimerEvent,
        Level = events.Level,
        Code = events.Code,

        _id = 0,
        _instances = {},
        _default = {
            ip: '',
            maxRetries: 0, // maximum number of retries while some types of error occurs. -1 means always
            profile: '720P_1',
            retryIn: 1000 + Math.random() * 2000, // ms. retrying interval
            url: 'wss://' + location.host + '/rtc/sig',
            codecpreferences: [],
            rtcconfiguration: {},
        };

    function RTC(id, option) {
        var _this = this,
            _id = id,
            _logger = option instanceof utils.Logger ? option : new utils.Logger(id, option),
            _nc,
            _publisher,
            _subscribers, // name: ns
            _videomixer,
            _stats,
            _timer,
            _retried;

        EventDispatcher.call(this, 'RTC', { id: id, logger: _logger }, Event, NetStatusEvent);

        function _init() {
            _this.logger = _logger;
            _subscribers = {};
            _retried = 0;
        }

        _this.id = function () {
            return _id;
        };

        _this.setup = async function (config) {
            _this.config = utils.extendz({ id: _id }, _default, config);
            _this.constraints = utils.extendz({}, RTC.NetStream.prototype.CONF, RTC.Constraints[_this.config.profile]);

            _nc = new RTC.NetConnection(_this.config.rtcconfiguration, _logger);
            _nc.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _nc.addEventListener(Event.CLOSE, _onClose);

            _stats = new utils.Timer(1000, 0, _logger);
            _stats.addEventListener(TimerEvent.TIMER, _onStats);

            _timer = new utils.Timer(_this.config.retryIn, 1, _logger);
            _timer.addEventListener(TimerEvent.TIMER, _onTimer);

            _bind();
            return await _connect();
        };

        function _bind() {
            _this.state = _nc.state;
            _this.dispatchEvent(Event.BIND);
            _this.dispatchEvent(Event.READY);
        }

        async function _connect() {
            try {
                await _nc.connect(_this.config.url);
            } catch (err) {
                _logger.error(`Failed to connect: ${err}`);
                return Promise.reject(err);
            }
            return Promise.resolve();
        };

        _this.setProfile = function (profile) {
            _this.config.profile = profile;
            _this.constraints = utils.extendz(_this.constraints, RTC.Constraints[_this.config.profile]);
        };

        _this.setFramerate = function (fps) {
            _this.applyConstraints({
                video: {
                    frameRate: fps,
                },
            });
        };

        _this.setBitrate = function (bitrate) {
            _this.applyConstraints({
                video: {
                    maxBitrate: bitrate,
                },
            });
        };

        _this.applyConstraints = function (constraints) {
            _this.constraints = utils.extendz(_this.constraints, constraints);
        };

        _this.publish = async function (screensharing, withcamera, option, callback) {
            if (_publisher) {
                _logger.error(`Already published.`);
                return Promise.reject('publishing');
            }

            _publisher = new RTC.NetStream({
                ip: _this.config.ip,
                codecpreferences: _this.config.codecpreferences,
            }, _logger);
            _publisher.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _publisher.addEventListener(Event.CLOSE, _onCloseStream);
            _publisher.applyConstraints(_this.constraints);
            await _publisher.attach(_nc);

            var stream;
            if (screensharing) {
                if (withcamera) {
                    stream = new MediaStream();

                    _videomixer = new RTC.Mixer.VideoMixer(_logger);
                    _videomixer.applyConstraints(_this.constraints.video);

                    var source = await _publisher.getDisplayMedia();
                    source.getAudioTracks().forEach(function (track) {
                        stream.addTrack(track);
                    });
                    var screen = utils.createElement('video');
                    screen.setAttribute('playsinline', '');
                    screen.setAttribute('autoplay', '');
                    screen.width = _this.constraints.video.width;
                    screen.height = _this.constraints.video.height;
                    screen.muted = true;
                    screen.track = source.getVideoTracks()[0];
                    screen.srcObject = source;
                    screen.play();
                    _videomixer.add(screen, { layer: 0 });

                    source = await _publisher.getUserMedia();
                    source.getAudioTracks().forEach(function (track) {
                        stream.addTrack(track);
                    });
                    var camera = utils.createElement('video');
                    camera.setAttribute('playsinline', '');
                    camera.setAttribute('autoplay', '');
                    camera.width = option && option.width ? option.width : 320;
                    camera.height = option && option.height ? option.height : 180;
                    camera.muted = true;
                    camera.track = source.getVideoTracks()[0];
                    camera.srcObject = source;
                    camera.play();
                    _videomixer.add(camera, utils.extendz({ layer: 4 }, utils.extendz({ top: 20, right: 20 }, option)));

                    _videomixer.start();
                    source = _videomixer.stream();
                    source.getVideoTracks().forEach(function (track) {
                        stream.addTrack(track);
                    });
                } else {
                    stream = await _publisher.getDisplayMedia();
                }
            } else {
                stream = await _publisher.getUserMedia();
            }
            stream.getTracks().forEach(function (track) {
                _publisher.addTrack(track, stream);
            });
            if (callback) {
                callback(stream);
            }
            try {
                await _publisher.publish();
            } catch (err) {
                _logger.error(`Failed to publish on pipe ${_publisher.id()}`);
                return Promise.reject(err);
            }
            _stats.start();
            return Promise.resolve(_publisher);
        };

        _this.unpublish = function () {
            if (_videomixer) {
                _videomixer.forEach(function (element) {
                    var track = element.track;
                    if (track) {
                        _logger.log(`Stopping track: kind=${track.kind}, id=${track.id}, label=${track.label}`);
                        track.stop();
                    }
                });
                _videomixer.stop();
            }
            if (_publisher) {
                var senders = _publisher.getSenders();
                senders.forEach(function (sender) {
                    var track = sender.track;
                    if (track) {
                        _logger.log(`Stopping track: kind=${track.kind}, id=${track.id}, label=${track.label}`);
                        track.stop();
                    }
                });
                _publisher.release('unpublish');
                _publisher = undefined;
            }
        };

        _this.play = async function (name) {
            if (_subscribers.hasOwnProperty(name)) {
                _logger.error(`Stream ${name} is already playing.`);
                return Promise.reject('playing');
            }

            var ns = new RTC.NetStream({
                ip: _this.config.ip,
                codecpreferences: _this.config.codecpreferences,
            }, _logger);
            ns.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            ns.addEventListener(Event.CLOSE, _onCloseStream);
            try {
                await ns.attach(_nc);
                await ns.play(name, "all");
                _subscribers[name] = ns;
            } catch (err) {
                _logger.error(`Failed to play stream ${name} on pipe ${ns.id()}.`);
                return Promise.reject(err);
            }
            _stats.start();
            return Promise.resolve(ns);
        };

        _this.stop = function (name) {
            var ns = _subscribers[name];
            if (ns) {
                ns.stop(name);
            }
        };

        _this.stopAll = function () {
            for (var name in _subscribers) {
                var ns = _subscribers[name];
                if (ns) {
                    ns.stop(name);
                }
            }
        };

        function _onStatus(e) {
            var level = e.data.level;
            var code = e.data.code;
            var description = e.data.description;
            var info = e.data.info;
            var method = { status: 'debug', warning: 'warn', error: 'error' }[level] || 'debug';
            _logger[method](`onStatus: level=${level}, code=${code}, description=${description}, info=`, info);

            switch (code) {
                case Code.NETCONNECTION_CONNECT_SUCCESS:
                    if (info && info.ip) {
                        _this.config.ip = info.ip;
                    }
                    break;
                case Code.NETSTREAM_FAILED:
                case Code.NETSTREAM_PLAY_RESET:
                case Code.NETSTREAM_PLAY_FAILED:
                    var ns = e.target;
                    ns.close(e.data.description);
                    break;
            }
            _this.forward(e);
        }

        function _onCloseStream(e) {
            var ns = e.target;
            _logger.log(`onCloseStream: ${e.data.reason}`);
            ns.removeEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            ns.removeEventListener(Event.CLOSE, _onCloseStream);
            if (ns.stream) {
                delete _subscribers[ns.stream.id];
            }
        }

        function _onClose(e) {
            _logger.log(`onClose: ${e.data.reason}`);
            _this.destroy(e.data.reason);
            _this.forward(e);

            if (_retried++ < _this.config.maxRetries || _this.config.maxRetries === -1) {
                _logger.debug('Retrying...');
                _timer.start();
            }
        }

        async function _onTimer(e) {
            await _connect();
        }

        function _onStats(e) {
            if (_publisher) {
                _getStats(_publisher);
            }
            utils.forEach(_subscribers, function (_, ns) {
                _getStats(ns);
            });
            if ((_stats.currentCount() % _logger.config.interval) === 0) {
                _logger.flush();
            }
        }

        function _getStats(ns) {
            if (ns.stream) {
                ns.getStats().then((stats) => {
                    _logger.append(Logger.Level.LOG, [{
                        reporter: _nc.properties.id || '',
                        stream: ns.stream.id,
                        stats: stats,
                    }]);
                });
            }
        }

        _this.destroy = function (reason) {
            _timer.reset();
            switch (_this.state()) {
                case RTC.State.CONNECTED:
                case RTC.State.INITIALIZED:
                    if (_nc) {
                        _nc.close(reason);
                        _nc.removeEventListener(NetStatusEvent.NET_STATUS, _this.forward);
                        _nc.removeEventListener(Event.CLOSE, _this.forward);
                    }
                    delete _instances[_id];
                    break;
            }
        };

        _init();
    }

    RTC.prototype = Object.create(EventDispatcher.prototype);
    RTC.prototype.constructor = RTC;
    RTC.prototype.CONF = _default;

    RTC.getDevices = async function (_logger) {
        var devices = [];
        try {
            devices = await navigator.mediaDevices.enumerateDevices();
            devices.forEach(function (device, index) {
                _logger.log(`Got device: kind=${device.kind}, id=${device.deviceId}, label=${device.label}`);
            });
        } catch (err) {
            _logger.error(`Failed to get devices: ${err}`);
        }
        return devices;
    };

    RTC.getCameras = async function (_logger) {
        var cameras = [];
        try {
            var devices = await navigator.mediaDevices.enumerateDevices();
            devices.forEach(function (device, index) {
                if (device.kind === 'videoinput') {
                    _logger.log(`Camera: id=${device.deviceId}, label=${device.label}`);
                    cameras.push(device);
                }
            });
        } catch (err) {
            _logger.error(`Failed to get cameras: ${err}`);
        }
        return cameras;
    };

    RTC.getMicrophones = async function (_logger) {
        var microphones = [];
        try {
            var devices = await navigator.mediaDevices.enumerateDevices();
            devices.forEach(function (device, index) {
                if (device.kind === 'audioinput') {
                    _logger.log(`Microphone: id=${device.deviceId}, label=${device.label}`);
                    microphones.push(device);
                }
            });
        } catch (err) {
            _logger.error(`Failed to get microphones: ${err}`);
        }
        return microphones;
    };

    RTC.getPlaybackDevices = async function (_logger) {
        var playbacks = [];
        try {
            var devices = await navigator.mediaDevices.enumerateDevices();
            devices.forEach(function (device, index) {
                if (device.kind === 'audiooutput') {
                    _logger.log(`Playback device: id=${device.deviceId}, label=${device.label}`);
                    playbacks.push(device);
                }
            });
        } catch (err) {
            _logger.error(`Failed to get playback devices: ${err}`);
        }
        return playbacks;
    };

    RTC.getSupportedCodecs = function (_logger) {

    };

    RTC.get = function (id, option) {
        if (id == null) {
            id = 0;
        }
        var rtc = _instances[id];
        if (rtc === undefined) {
            rtc = new RTC(id, option);
            _instances[id] = rtc;
        }
        return rtc;
    };

    RTC.create = function (option) {
        return RTC.get(_id++, option);
    };

    odd.rtc = RTC.get;
    odd.rtc.create = RTC.create;
    odd.RTC = RTC;
})(odd);

