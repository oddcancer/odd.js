player.innerHTML = '';

var utils = odd.utils,
    index = 0;

var ui = odd.player.ui.create({ mode: 'file' });
// ui.addGlobalListener(console.log);
ui.addEventListener('ready', onReady);
ui.addEventListener('click', onClick);
// ui.addEventListener('sei', console.log);
ui.addEventListener('screenshot', onScreenshot);
ui.addEventListener('error', console.error);
ui.setup(player, {
    autoplay: false,
    bufferLength: 0.5,       // sec.
    // file: 'http://127.0.0.1/vod/sample.mp4',
    // file: 'http://127.0.0.1/vod/sample.flv',
    // file: 'ws://192.168.0.117/live/_definst_/abc.flv',
    // file: 'http://192.168.0.117/live/_definst_/abc/index.m3u8',
    // file: 'http://stream.xthktech.cn:8081/live/_definst_/abc.flv',
    // file: 'https://www.oddcancer.com/live/_definst_/abc.flv',
    lowlatency: true,        // ll-dash, ll-hls, ll-flv/fmp4 (auto reduce latency due to cumulative ack of tcp)
    maxBufferLength: 1.5,    // sec.
    maxRetries: 0,           // maximum number of retries while some types of error occurs. -1 means always
    mode: 'live',            // live, vod
    module: 'FLV',           // SRC, FLV, FMP4, DASH*, HLS*, RTC
    objectfit: 'contain',    // fill, contain, cover, none, scale-down
    retrying: 0,             // ms. retrying interval
    loader: {
        name: 'auto',
        mode: 'cors',        // cors, no-cors, same-origin
        credentials: 'omit', // omit, include, same-origin
    },
    service: {
        script: 'js/sw.js',
        scope: 'js/',
        enable: true,
    },
    sources: [{
        file: 'https://www.oddcancer.com/live/_definst_/abc.flv',
        module: 'FLV',
        label: 'http-flv',
        default: true,
    }, {
        file: 'wss://www.oddcancer.com/live/_definst_/abc',
        module: 'FMP4',
        label: 'ws-fmp4',
    }, {
        file: 'wss://www.oddcancer.com/rtc/sig?name=abc',
        module: 'RTC',
        label: 'rtc',
    }, {
        file: 'https://www.oddcancer.com/live/_definst_/abc/index.m3u8',
        module: 'SRC',
        label: 'hls',
    }],
    plugins: [{
        kind: 'Poster',
        file: 'image/solution-vod-poster.png',
        cors: 'anonymous',    // anonymous, use-credentials
        objectfit: 'contain', // fill, contain, cover, none, scale-down
        visibility: true,
    }, {
        kind: 'Display',
        layout: '[Button:play=][Button:waiting=][Label:error=][Panel:info=][Panel:stats=]',
        ondoubleclick: 'fullscreen',
        visibility: true,
    }, {
        kind: 'Controlbar',
        layout: '[Slider:timebar=Preview]|[Button:play=??????][Button:pause=??????][Button:reload=????????????][Button:stop=??????][Label:quote=Live broadcast][Label:time=00:00/00:00]||[Button:report=??????][Button:capture=??????][Button:download=??????][Button:mute=??????][Button:unmute=????????????][Slider:volumebar=80][Select:definition=?????????][Button:danmuoff=????????????][Button:danmuon=????????????][Button:fullpage=????????????][Button:exitfullpage=??????????????????][Button:fullscreen=??????][Button:exitfullscreen=????????????]',
        autohide: false,
        visibility: true,
    }],
});

function onReady(e) {
    // ui.record('fragmented.mp4').then((writer) => {
    //     setTimeout(function () {
    //         writer.close();
    //     }, 10 * 000);
    // });
}

function onClick(e) {
    switch (e.data.name) {
        case 'report':
            ui.logger.flush();
            break;
    }
}

function onScreenshot(e) {
    var arr = e.data.image.split(',');
    var ret = arr[0].match(/^data:(image\/(.+));base64$/);
    if (ret === null) {
        console.error('The string did not match the expected pattern.');
        return;
    }

    var link = document.createElement('a');
    link.href = e.data.image;
    link.download = 'screenshot-' + utils.padStart(index++, 3, '0') + '.' + ret[2];
    link.click();
}

function onPlayClick() {
    ui.play(url.value);
}
