(function (odd) {
    var utils = odd.utils,
        events = odd.events,
        EventDispatcher = events.EventDispatcher,
        Event = events.Event,
        NetStatusEvent = events.NetStatusEvent,
        Level = events.Level,
        Code = events.Code,
        RTC = odd.RTC,
        Constraints = RTC.Constraints,
        Responder = RTC.Responder,
        State = RTC.State,
        Signal = RTC.Signal,

        _default = {
            ip: '',
            codecpreferences: [
                'audio/opus',
                'video/VP8',
            ],
        },
        _constraints = utils.extendz({}, {
            audio: {
                deviceId: '',
            },
            video: {
                deviceId: '',
                facingMode: 'user',
                cursor: 'always', // always, motion, never
            },
        }, Constraints['720P_1']);

    function NetStream(config, logger) {
        EventDispatcher.call(this, 'NetStream', { logger: logger }, Event, NetStatusEvent);

        var _this = this,
            _logger = logger,
            _id,
            _client,
            _pc,
            _stats,
            _handlers,
            _subscribing,
            _readyState,
            _released;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
            _this.constraints = utils.extendz({}, _constraints);
            _this.stream = null;
            _id = 0;
            _stats = new RTC.Stats(_logger);
            _subscribing = [];
            _readyState = State.INITIALIZED;
            _released = false;

            _handlers = {
                sdp: _processCommandSdp,
                candidate: _processCommandCandidate,
                status: _processCommandStatus,
            };
        }

        _this.id = function () {
            return _id;
        };

        _this.client = function () {
            return _client;
        };

        _this.attach = async function (nc) {
            _client = nc;
            _pc = new RTCPeerConnection(_client.config);
            _pc.addEventListener('negotiationneeded', _onNegotiationNeeded);
            _pc.addEventListener('track', _onTrack);
            _pc.addEventListener('connectionstatechange', _onConnectionStateChange);
            _pc.addEventListener('icecandidate', _onIceCandidate);
            _pc.addEventListener('iceconnectionstatechange', _onIceConnectionStateChange);

            return await _client.create(_this, new Responder(function (m) {
                _id = m.data.id;
                _readyState = State.CONNECTED;
            }, function (m) {
                _this.close(m.data.description);
            }));
        };

        _this.applyConstraints = function (constraints) {
            _this.constraints = utils.extendz({}, _constraints, constraints);
        };

        _this.getUserMedia = async function () {
            var stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(_this.constraints);
                _logger.log(`Got user media: id=${stream.id}, constraints=${_this.constraints}`);
            } catch (err) {
                _logger.error(`Failed to get user media: constraints=${_this.constraints}, error=${err}`);
                return Promise.reject(err);
            }
            return Promise.resolve(stream);
        };

        _this.getDisplayMedia = async function () {
            var stream;
            try {
                stream = await navigator.mediaDevices.getDisplayMedia(_this.constraints);
                _logger.log(`Got display media: id=${stream.id}, constraints=${_this.constraints}`);
            } catch (err) {
                _logger.error(`Failed to get display media: constraints=${_this.constraints}, error=${err}`);
                return Promise.reject(err);
            }
            return Promise.resolve(stream);
        };

        _this.addTrack = function (track, stream) {
            track.addEventListener('ended', _onEnded);
            track.addEventListener('mute', _onMute);
            track.addEventListener('unmute', _onUnmute);

            var sender = _pc.addTrack(track, stream);
            if (sender.track.id !== track.id) {
                _logger.warn(`Track id changed: ${sender.track.id} != ${track.id}`);
            }
            _this.stream = stream;
            return sender;
        };

        _this.removeTrack = function (sender) {
            var track = sender.track;
            if (track) {
                track.removeEventListener('ended', _onEnded);
                track.removeEventListener('mute', _onMute);
                track.removeEventListener('unmute', _onUnmute);

                _this.dispatchEvent(NetStatusEvent.NET_STATUS, {
                    level: Level.STATUS,
                    code: Code.NETSTREAM_UNPUBLISH_SUCCESS,
                    description: 'unpublish success',
                    info: {
                        track: track.id,
                    },
                });
            }
            _pc.removeTrack(sender);
        };

        function _onEnded(e) {
            var track = e.target;
            _logger.log(`Track ended: kind=${track.kind}, id=${track.id}, label=${track.label}`);
        }

        function _onMute(e) {
            var track = e.target;
            _logger.log(`Track muted: kind=${track.kind}, id=${track.id}, label=${track.label}`);
        }

        function _onUnmute(e) {
            var track = e.target;
            _logger.log(`Track unmuted: kind=${track.kind}, id=${track.id}, label=${track.label}`);
        }

        _this.publish = async function () {
            var audiocodecs = [];
            var videocodecs = [];
            RTCRtpSender.getCapabilities('audio').codecs.forEach(function (codec) {
                for (var i = 0; i < _this.config.codecpreferences.length; i++) {
                    if (_this.config.codecpreferences[i] === codec.mimeType) {
                        audiocodecs.push(codec);
                    }
                }
            });
            RTCRtpSender.getCapabilities('video').codecs.forEach(function (codec) {
                for (var i = 0; i < _this.config.codecpreferences.length; i++) {
                    if (_this.config.codecpreferences[i] === codec.mimeType) {
                        videocodecs.push(codec);
                    }
                }
            });
            _pc.getTransceivers().forEach(function (transceiver) {
                switch (transceiver.sender.track.kind) {
                    case 'audio':
                        transceiver.setCodecPreferences(audiocodecs);
                        break;
                    case 'video':
                        transceiver.setCodecPreferences(videocodecs);
                        break;
                }
            });

            try {
                var offer = await _pc.createOffer();
                _logger.log(`createOffer success: id=${_id}, sdp=\n${offer.sdp}`);
            } catch (err) {
                _logger.error(`Failed to createOffer: id=${_id}`);
                return Promise.reject(err);
            }
            try {
                await _pc.setLocalDescription(offer);
                _logger.log(`setLocalDescription success: id=${_id}, type=${offer.type}`);
            } catch (err) {
                _logger.error(`Failed to setLocalDescription: id=${_id}, type=${offer.type}`);
                return Promise.reject(err);
            }

            _readyState = State.PUBLISHING;

            return await _client.call(Signal.SDP, _id, null, {
                type: offer.type,
                sdp: offer.sdp,
            }).then(() => {
                _logger.log(`Send offer success.`);
            }).catch((err) => {
                _logger.error(`Failed to send offer: ${err}`);
            });
        };

        _this.play = async function (name, mode) {
            _readyState = State.PLAYING;

            return await _client.call(Signal.PLAY, _id, null, {
                stream: name,
                mode: mode,
            }).then(() => {
                _logger.log(`Send play success.`);
            }).catch((err) => {
                _logger.error(`Failed to send play: ${err}`);
            });
        };

        _this.stop = function (name) {
            return _client.call(Signal.STOP, _id, null, {
                stream: name,
            });
        };

        _this.getTransceivers = function () {
            return _pc.getTransceivers();
        };

        _this.getSenders = function () {
            return _pc.getSenders();
        };

        _this.getReceivers = function () {
            return _pc.getReceivers();
        };

        function _onNegotiationNeeded(e) {
            // We don't negotiate at this moment, until user called publish manually.
            _logger.log(`onNegotiationNeeded: id=${_id}`);
        }

        function _onTrack(e) {
            _logger.log(`onTrack: kind=${e.track.kind}, track=${e.track.id}, stream=${e.streams[0].id}`);
            _subscribing.push(e.track);
            _this.stream = e.streams[0];
            _this.dispatchEvent(NetStatusEvent.NET_STATUS, {
                level: Level.STATUS,
                code: Code.NETSTREAM_PLAY_START,
                description: 'play start',
                info: {
                    track: e.track,
                    streams: e.streams,
                },
            });
        }

        function _onConnectionStateChange(e) {
            var pc = e.target;
            _logger.log(`onConnectionStateChange: id=${_id}, state=${pc.connectionState}`);
            switch (pc.connectionState) {
                case 'disconnected':
                case 'failed':
                case 'closed':
                    _this.close(pc.connectionState);
                    break;
            }
        }

        function _onIceCandidate(e) {
            var candidate = e.candidate;
            if (candidate == null) {
                candidate = {
                    candidate: '',
                    sdpMid: '',
                    sdpMLineIndex: 0,
                };
            }
            _logger.log(`onIceCandidate: id=${_id}, candidate=${candidate.candidate}, mid=${candidate.sdpMid}, mlineindex=${candidate.sdpMLineIndex}`);

            _client.call(Signal.CANDIDATE, _id, null, {
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
            }).catch((err) => {
                _logger.error(`Failed to send candidate: ${err}`);
            });
        }

        function _onIceConnectionStateChange(e) {
            var pc = e.target;
            _logger.log(`onIceConnectionStateChange: id=${_id}, state=${pc.iceConnectionState}`);
        }

        _this.process = function (m) {
            var handler = _handlers[m.type];
            if (handler != null) {
                return handler(m);
            }
            // Should not return error, just ignore.
            _logger.warn(`No handler found: id=${_id}, signal=${m.type}, arguments=${m.data}`);
            return Promise.resolve();
        };

        async function _processCommandSdp(m) {
            _logger.log(`onSdp: id=${_id}, type=${m.data.type}, sdp=\n${m.data.sdp}`);
            try {
                await _pc.setRemoteDescription(new RTCSessionDescription({ type: m.data.type, sdp: m.data.sdp }));
                _logger.log(`setRemoteDescription success: id=${_id}, type=${m.data.type}`);
            } catch (err) {
                _logger.error(`Failed to setRemoteDescription: id=${_id}, type=${m.data.type}`);
                return Promise.reject(err);
            }
            if (m.data.type === 'answer') {
                _pc.getSenders().forEach(function (sender) {
                    var track = sender.track;
                    if (track.kind === 'video') {
                        var bitrate = _this.constraints.video.maxBitrate * 1000;
                        var parameters = sender.getParameters();
                        parameters.encodings.forEach(function (encoding) {
                            encoding.maxBitrate = bitrate;
                        });
                        sender.setParameters(parameters).then(function () {
                            _logger.log(`Set max bitrate: ${bitrate}`);
                        }).catch(function (err) {
                            _logger.warn(`Failed to set max bitrate: ${err}`);
                        });
                    }
                });
                return Promise.resolve();
            }
            try {
                var answer = await _pc.createAnswer();
                _logger.log(`createAnswer success: id=${_id}, sdp=\n${answer.sdp}`);
            } catch (err) {
                _logger.error(`Failed to createAnswer: id=${_id}`);
                return Promise.reject(err);
            }
            try {
                await _pc.setLocalDescription(answer);
                _logger.log(`setLocalDescription success: id=${_id}, type=${answer.type}`);
            } catch (err) {
                _logger.error(`Failed to setLocalDescription: id=${_id}, type=${answer.type}`);
                return Promise.reject(err);
            }

            return await _client.call(Signal.SDP, _id, null, {
                type: answer.type,
                sdp: answer.sdp,
            }).then(() => {
                _logger.log(`Send answer success.`);
            }).catch((err) => {
                _logger.error(`Failed to send answer: ${err}`);
            });
        }

        async function _processCommandCandidate(m) {
            try {
                var candidate = new RTCIceCandidate({
                    candidate: m.data.candidate,
                    sdpMid: m.data.sdpMid || '',
                    sdpMLineIndex: m.data.sdpMLineIndex || 0,
                });
                switch (candidate.type) {
                    case 'host':
                        if (_this.config.ip) {
                            m.data.candidate = m.data.candidate.replace(candidate.address, _this.config.ip);
                            candidate = new RTCIceCandidate({
                                candidate: m.data.candidate,
                                sdpMid: m.data.sdpMid || '',
                                sdpMLineIndex: m.data.sdpMLineIndex || 0,
                            });
                        }
                        break;
                }
                await _pc.addIceCandidate(candidate);
                _logger.log(`addIceCandidate success: id=${_id}, candidate=${candidate.candidate}, mid=${candidate.sdpMid}, mlineindex=${candidate.sdpMLineIndex}`);
            } catch (err) {
                _logger.error(`Failed to addIceCandidate: id=${_id}, candidate=${candidate.candidate}, mid=${candidate.sdpMid}, mlineindex=${candidate.sdpMLineIndex}`);
                return Promise.reject(err);
            }
            return Promise.resolve();
        }

        function _processCommandStatus(m) {
            var level = m.data.level;
            var code = m.data.code;
            var description = m.data.description;
            var info = m.data.info;
            _logger.debug(`onStatus: id=${_id}, level=${level}, code=${code}, description=${description}, info=`, info);

            switch (code) {
                case Code.NETSTREAM_UNPUBLISH_SUCCESS:
                case Code.NETSTREAM_PLAY_START:
                    // Ignore these status, because we can not trust them, while they may be lost.
                    // Instead, we'll fire these events based on the local methods and events.
                    return;
                case Code.NETSTREAM_PLAY_STOP:
                case Code.NETSTREAM_PLAY_UNPUBLISHNOTIFY:
                    _this.dispatchEvent(NetStatusEvent.NET_STATUS, m.data);
                    for (var i = 0; i < _subscribing.length; i++) {
                        var track = _subscribing[i];
                        if (track.id === info.track) {
                            _subscribing.splice(i, 1);
                            if (_subscribing.length === 0) {
                                _logger.log(`There's no receiver remains: ${_id}`);
                                _this.dispatchEvent(NetStatusEvent.NET_STATUS, {
                                    level: Level.STATUS,
                                    code: Code.NETSTREAM_PLAY_RESET,
                                    description: 'play reset',
                                });
                            }
                            break;
                        }
                    }
                    return;
            }
            _this.dispatchEvent(NetStatusEvent.NET_STATUS, m.data);
            return Promise.resolve();
        }

        _this.getStats = async function () {
            return await _pc.getStats().then((report) => {
                report.forEach((item) => {
                    _stats.parse(item);
                });
                return Promise.resolve(_stats.report);
            }).catch((err) => {
                _logger.warn(`Failed to getStats: ${err}`);
            });
        };

        _this.state = function () {
            return _readyState;
        };

        _this.release = function (reason) {
            _client.call(Signal.RELEASE, _client.id(), null, {
                id: _id,
            }).catch((err) => {
                _logger.error(`Failed to send release: ${err}`);
            });
            _released = true;
            _this.close(reason);
        };

        _this.close = function (reason) {
            switch (_readyState) {
                case State.CONNECTED:
                case State.PUBLISHING:
                case State.PLAYING:
                    _readyState = State.CLOSING;

                    var senders = _pc.getSenders();
                    senders.forEach(function (sender) {
                        var track = sender.track;
                        if (track) {
                            _this.dispatchEvent(NetStatusEvent.NET_STATUS, {
                                level: Level.STATUS,
                                code: Code.NETSTREAM_UNPUBLISH_SUCCESS,
                                description: 'unpublish success',
                                info: {
                                    track: track.id,
                                },
                            });
                        }
                    });
                    var receivers = _pc.getReceivers();
                    receivers.forEach(function (receiver) {
                        var track = receiver.track;
                        if (track) {
                            _this.dispatchEvent(NetStatusEvent.NET_STATUS, {
                                level: Level.STATUS,
                                code: Code.NETSTREAM_PLAY_STOP,
                                description: 'play stop',
                                info: {
                                    track: track.id,
                                },
                            });
                        }
                    });

                    _pc.close();
                    _subscribing = [];
                    _this.stream = null;

                    _this.dispatchEvent(Event.CLOSE, { reason: reason });
                    if (_released) {
                        _this.dispatchEvent(Event.RELEASE, { reason: reason });
                    }
                    _readyState = State.CLOSED;
                    break;

                case State.INITIALIZED:
                    _this.dispatchEvent(Event.CLOSE, { reason: reason });
                    if (_released) {
                        _this.dispatchEvent(Event.RELEASE, { reason: reason });
                    }
                    _readyState = State.CLOSED;
                    break;
            }
        };

        _init();
    }

    NetStream.prototype = Object.create(EventDispatcher.prototype);
    NetStream.prototype.constructor = NetStream;
    NetStream.prototype.CONF = _default;

    RTC.NetStream = NetStream;
})(odd);

