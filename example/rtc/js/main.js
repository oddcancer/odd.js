var utils = odd.utils,
    events = odd.events,
    Event = events.Event,
    NetStatusEvent = events.NetStatusEvent,
    Level = events.Level,
    Code = events.Code,
    RTC = odd.RTC,
    NetConnection = RTC.NetConnection,
    NetStream = RTC.NetStream,
    Constraints = RTC.Constraints,

    _detected = false,
    _publisher = undefined,
    _subscribers = {}; // ns.id: ns

var rtc = odd.rtc.create({ mode: 'feedback', url: 'https://fc.oddcancer.com/rtc/log', interval: 60 });
rtc.addEventListener(NetStatusEvent.NET_STATUS, onRTCStatus);
rtc.addEventListener(Event.CLOSE, console.log);
rtc.setup({
    maxRetries: -1,
    profile: sl_profiles.value || '180P_1',
    retryIn: 2000,
    url: 'wss://' + location.host + '/rtc/sig',
    codecpreferences: [
        'audio/opus',
        'video/VP8',
    ],
});

(async function () {
    getProfiles();
    await getDevices();
})();

function getProfiles() {
    var labels = ['1080P_1', '720P_1', '540P_1', '360P_1', '180P_1'];
    for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        var option = utils.createElement('option');
        option.selected = i === 4 ? 'selected' : undefined;
        option.value = label;
        option.innerHTML = label;
        sl_profiles.appendChild(option);
    }
}

async function getDevices() {
    if (_detected === false) {
        try {
            var cameras = await RTC.getCameras(rtc.logger);
            for (var i = 0; i < cameras.length; i++) {
                var device = cameras[i];
                var option = utils.createElement('option');
                option.value = device.deviceId;
                option.innerHTML = device.label;
                sl_cameras.appendChild(option);
            }
            var microphones = await RTC.getMicrophones(rtc.logger);
            for (var i = 0; i < microphones.length; i++) {
                var device = microphones[i];
                var option = utils.createElement('option');
                option.value = device.deviceId;
                option.innerHTML = device.label;
                sl_microphones.appendChild(option);
            }
            _detected = true;
        } catch (err) {
            console.warn(`Failed to get devices: ${err}`);
        }
    }
}

async function onPublishClick(e) {
    if (_publisher) {
        console.warn(`Already published.`);
        return;
    }

    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('controls', '');
    video.muted = true;
    video.play().catch(function (err) {
        console.warn(`${err}`);
    });
    view.appendChild(video);

    rtc.setProfile(sl_profiles.value);
    if (ch_enablevideo.checked === false) {
        rtc.applyConstraints({ video: false });
    }
    if (ch_enableaudio.checked === false) {
        rtc.applyConstraints({ audio: false });
    }
    var ns = await rtc.publish(sl_mode.value > 0, sl_mode.value == 2, null, function (stream) {
        video.srcObject = stream;
    }).catch(function (err) {
        console.warn(`${err}`);
    });
    ns.addEventListener(Event.CLOSE, (function (ns, video) {
        return function (e) {
            view.removeChild(video);
        };
    })(ns, video));
    _publisher = ns;
}

function onChangeProfileClick(e) {
    rtc.setProfile(sl_profiles.value);
}

function onChangeCameraClick(e) {
    rtc.applyConstraints({ video: { deviceId: sl_cameras.value } });
}

function onChangeMicrophoneClick(e) {
    rtc.applyConstraints({ audio: { deviceId: sl_microphones.value } });
}

function onUnpublishClick(e) {
    rtc.unpublish();
    _publisher = undefined;
}

async function onPlayClick(e) {
    await play(in_data.value);
}

async function play(name) {
    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('controls', '');
    view.appendChild(video);

    var ns = await rtc.play(name).catch(function (err) {
        console.warn(`${err}`);
    });
    ns.addEventListener(NetStatusEvent.NET_STATUS, (function (ns, video) {
        return function (e) {
            switch (e.data.code) {
                case Code.NETSTREAM_PLAY_START:
                    video.srcObject = e.data.info.streams[0];
                    video.play().catch(function (err) {
                        console.warn(`${err}`);
                    });
                    _subscribers[ns.id()] = ns;
                    break;
            }
        };
    })(ns, video));
    ns.addEventListener(Event.CLOSE, (function (ns, video) {
        return function (e) {
            view.removeChild(video);
            delete _subscribers[ns.id()];
        };
    })(ns, video));
}

function onStopClick(e) {
    rtc.stop(in_data.value);
}

function onRTCStatus(e) {
    var level = e.data.level;
    var code = e.data.code;
    var description = e.data.description;
    var info = e.data.info;
    var method = { status: 'log', warning: 'warn', error: 'error' }[level];
    rtc.logger[method](`onStatus: level=${level}, code=${code}, description=${description}, info=`, info);

    switch (code) {
        case Code.NETSTREAM_PUBLISH_START:
            if (im) {
                im.sendUserControl(0, null, {
                    type: 'published',
                    cast: 'multi',
                    chan: in_chan.value,
                    stream: info.stream,
                });
            }
            break;
    }
}
