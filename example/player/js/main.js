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
    module: 'SRC',           // SRC, FLV, FMP4, DASH*, HLS*, RTC
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
        enable: false,
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
        file: 'image/poster.png',
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
        layout: '[Slider:timebar=Preview]|[Button:play=播放][Button:pause=暂停][Button:reload=重新加载][Button:stop=停止][Label:quote=Live broadcast][Label:time=00:00/00:00]||[Button:report=反馈][Button:capture=截图][Button:download=下载][Button:mute=静音][Button:unmute=取消静音][Slider:volumebar=80][Select:definition=清晰度][Button:danmuoff=关闭弹幕][Button:danmuon=打开弹幕][Button:fullpage=网页全屏][Button:exitfullpage=退出网页全屏][Button:fullscreen=全屏][Button:exitfullscreen=退出全屏]',
        autohide: false,
        visibility: true,
    }],
});

function onReady(e) {
    // ui.record('fragmented.mp4');
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
