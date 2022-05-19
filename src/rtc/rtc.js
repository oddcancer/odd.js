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
            address: '',
            profile: '720P_1',
            url: 'wss://' + location.host + '/rtc/sig',
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
            _timer;

        EventDispatcher.call(this, 'RTC', { id: id, logger: _logger }, Event, NetStatusEvent);

        function _init() {
            _this.logger = _logger;
            _subscribers = {};
            _timer = new utils.Timer(1000, 0, _logger);
            _timer.addEventListener(TimerEvent.TIMER, _onTimer);
        }

        _this.id = function () {
            return _id;
        };

        _this.setup = async function (config) {
            _this.config = utils.extendz({ id: _id }, _default, config);
            _this.constraints = utils.extendz({}, RTC.NetStream.CONF, RTC.Constraints[_this.config.profile]);

            _nc = new RTC.NetConnection(_this.config.rtcconfiguration, _logger);
            _nc.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _nc.addEventListener(Event.CLOSE, _onClose);
            _bind();

            try {
                await _nc.connect(_this.config.url);
            } catch (err) {
                _logger.error(`Failed to connect: ${err}`);
                return Promise.reject(err);
            }
            return Promise.resolve();
        };

        function _bind() {
            _this.state = _nc.state;
            _this.dispatchEvent(Event.BIND);
            _this.dispatchEvent(Event.READY);
        }

        _this.setProfile = function (profile) {
            _this.config.profile = profile;
            _this.constraints = utils.extendz({}, RTC.NetStream.CONF, RTC.Constraints[_this.config.profile]);
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
            _publisher = new RTC.NetStream({ address: _this.config.address }, _logger);
            _publisher.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            _publisher.addEventListener(Event.CLOSE, _onCloseStream);
            _publisher.applyConstraints(_this.constraints);
            await _publisher.attach(_nc);

            var stream;
            if (screensharing) {
                stream = await _publisher.getDisplayMedia();
                if (withcamera) {
                    _videomixer = new RTC.Mixer.VideoMixer(_logger);
                    _videomixer.applyConstraints(_this.constraints.video);

                    stream.getAudioTracks().forEach(function (track) {
                        _publisher.addTrack(track, stream);
                    });

                    var screen = utils.createElement('video');
                    screen.setAttribute('playsinline', '');
                    screen.setAttribute('autoplay', '');
                    screen.width = _this.constraints.video.width;
                    screen.height = _this.constraints.video.height;
                    screen.muted = true;
                    screen.track = stream.getVideoTracks()[0];
                    screen.srcObject = stream;
                    screen.play();
                    _videomixer.add(screen, { layer: 0 });

                    stream = await _publisher.getUserMedia();
                    stream.getAudioTracks().forEach(function (track) {
                        _publisher.addTrack(track, stream);
                    });

                    var camera = utils.createElement('video');
                    camera.setAttribute('playsinline', '');
                    camera.setAttribute('autoplay', '');
                    camera.width = option && option.width ? option.width : 320;
                    camera.height = option && option.height ? option.height : 180;
                    camera.muted = true;
                    camera.track = stream.getVideoTracks()[0];
                    camera.srcObject = stream;
                    camera.play();
                    _videomixer.add(camera, utils.extendz({ layer: 4 }, utils.extendz({ top: 20, right: 20 }, option)));

                    _videomixer.start();
                    stream = _videomixer.stream();
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
                return Promise.reject(err);
            }
            _timer.start();
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
                _publisher.release();
                _publisher = undefined;
            }
        };

        _this.play = async function (name) {
            if (_subscribers.hasOwnProperty(name)) {
                return Promise.reject('playing');
            }

            var ns = new RTC.NetStream({ address: _this.config.address }, _logger);
            ns.addEventListener(NetStatusEvent.NET_STATUS, _onStatus);
            ns.addEventListener(Event.CLOSE, _onCloseStream);
            try {
                await ns.attach(_nc);
                await ns.play(name, "all");
                _subscribers[name] = ns;
            } catch (err) {
                return Promise.reject(err);
            }
            _timer.start();
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
            var ns = e.target;
            var level = e.data.level;
            var code = e.data.code;
            var description = e.data.description;
            var info = e.data.info;
            var method = { status: 'debug', warning: 'warn', error: 'error' }[level] || 'debug';
            _logger[method](`onStatus: level=${level}, code=${code}, description=${description}, info=`, info);

            switch (code) {
                case Code.NETCONNECTION_CONNECT_SUCCESS:
                    if (info && info.address) {
                        _this.config.address = info.address;
                    }
                    break;
                case Code.NETSTREAM_FAILED:
                case Code.NETSTREAM_PLAY_RESET:
                case Code.NETSTREAM_PLAY_FAILED:
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
        }

        function _onTimer(e) {
            if (_publisher) {
                _getStats(_publisher);
            }
            utils.forEach(_subscribers, function (_, ns) {
                _getStats(ns);
            });
            if ((_timer.currentCount() % _logger.config.interval) === 0) {
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
