# odd.player.js

> [[domain] https://www.oddcancer.com](https://www.oddcancer.com/product/player.html)  
> [[source] https://github.com/oddcancer/odd.js](https://github.com/oddcancer/odd.js)  
> [[中文] https://blog.csdn.net/icysky1989/article/details/75094205](https://blog.csdn.net/icysky1989/article/details/75094205)  
> QQ群：528109813  
> Skype: live:670292548  
> Email: 670292548@qq.com  

This is not only an [HTML5 FLV Player](https://github.com/oddcancer/odd.js#roadmap), which supports HTTP/WS-FLV live streaming, but also supports HTTP/WS-fMP4, MPEG-DASH, HLS and Original HTML5 Media Resources (eg. Ogg, Mpeg4, WebM), with an independent UI framework.  

Note:  

The open-sourced version (v1.2) is no longer being maintained. You can still find the source under branch "v1.2.xx". But it is outdated and not recommended to use in productions.

Instead, we've started a new version (v2) for business usage, which is much more professional, high-performance and stable, and compatiable with all of the browsers that supports [MSE](https://caniuse.com/?search=mse), including iPad Safari and Android Chrome. In this build, an UI framework is developed separately from the core SDK (known as API), and is much easier to understand and extend. In the meantime, the UI framework is open-sourced since v2.1.49 to help building customized UI, plugins and components.

The new core SDK provides more professional configurations, interfaces and events. In allusion to entertainment, monitoring, education and VR scenes, it is able to run in multi-instance mode and destroy dynamically, detect tracks automatically, synchronize audio and video while missing frames. In addition, configurable time range collector makes it functional 24/7. Tying in with reducing latency due to the cumulative ack of tcp, the latency of live broadcast can remain low. Besides, it also supports frame capture, progressive fMP4 recording at any time, real-time fetching and event reporting of media info, log feedback and so on.

The UI framework is built independently from the core SDK, driven by the interfaces and events. It is designed with multiple scalable and registering plugins, each instance supports simple skin switching. Among these plugins, Display and Controlbar provide a flexible way to setup components, such as customization, deleting or re-sorting.

If you are interested in this player, and or solutions about live media streaming, please contact us for details.

## Roadmap

### Core Modules

- [x] SRC (original html5 media resources, eg. Ogg, Mpeg4, WebM, etc.)  
- [x] FLV (http/ws)  
- [x] FMP4 (http/ws)  
- [ ] DASH (ll-cmaf)  
- [ ] HLS (ll-cmaf)  
- [ ] RTC  
- [ ] ~~Flash~~  

### UI Plugins

- [x] Poster  
- [x] v2.1.00 - Danmu  
- [x] Display  
- [ ] AD  
- [ ] Share  
- [x] Logo  
- [x] Controlbar  
- [x] ContextMenu  
- [ ] Playlist  

### Features

- [x] v2.0.89 - Synchronize video with audio while some frames are missing.  
- [x] v2.1.07 - Carry api.id while dispatching events.  
- [x] v2.1.10 - Remove media segments within a specific time range to release memory usage.  
- [x] v2.1.20 - Capture the current frame, and save as a picture.  
  - [x] v2.1.45 - New event for screenshot, and capture() will no longer auto download, but return the image data.  
- [x] v2.1.27 - Reduce latency by simply seeking.  
  - [x] v2.1.77 - Reduce latency smoothly, due to the cumulative ack of tcp.  
- [x] v2.1.33 - Ignore track depending on flv flags, to optimize audio only or video only streaming.  
- [x] v2.1.36 - Optimize track data into interleaved mode.  
- [x] v2.1.37 - Fix audio time issue.  
- [x] v2.1.38 - Fix incorrect ui display when exiting fullscreen by pressing esc.  
- [x] v2.1.43 - Buffer before starting to play.  
- [x] v2.1.50 - New interface[s]: create, destroy.  
- [x] v2.1.54 - New interface[s]: record.  
  - [x] v2.1.59 - StreamSaver using ServiceWorker.  
  - [x] v2.1.69 - StreamWriter starts while the first keyframe is detected.  
- [x] v2.1.67 - Implemented Logger class. New interface[s]: getProperty.  
  - [ ] Log feedback.  
- [x] v2.1.73 - New module[s]: FMP4.  
- [x] v2.1.93 - Fix sps parsing issue caused log2_max_frame_num_minus4 out of range.  
- [ ] Breakpoint download for http-flv playback (Send a HEAD request at first).  
- [ ] Experience statistics and analysis.  

## Solutions

- [x] [Live Broadcast](https://www.oddcancer.com/solution/live.html).  
- [x] [Live Broadcast on Mobile](https://www.oddcancer.com/solution/live-mobile.html).  
- [x] [Monitor Example](https://www.oddcancer.com/solution/monitor.html?n=9).  

## Example

### Use the SDK directly

```js
var utils = odd.utils,
    events = odd.events,
    Event = events.Event,
    IOEvent = events.IOEvent,
    MediaEvent = events.MediaEvent,
    SaverEvent = events.SaverEvent,
    index = 0;

var api = odd.player();
api.addEventListener(Event.READY, onReady);
api.addEventListener(Event.PLAY, console.log);
api.addEventListener(IOEvent.LOADSTART, console.log);
api.addEventListener(Event.WAITING, console.log);
api.addEventListener(IOEvent.STALLED, console.log);
api.addEventListener(IOEvent.ABORT, console.log);
api.addEventListener(IOEvent.TIMEOUT, console.log);
api.addEventListener(Event.DURATIONCHANGE, console.log);
api.addEventListener(Event.LOADEDMETADATA, console.log);
api.addEventListener(Event.LOADEDDATA, console.log);
api.addEventListener(IOEvent.PROGRESS, console.log);
api.addEventListener(Event.CANPLAY, console.log);
api.addEventListener(Event.PLAYING, console.log);
api.addEventListener(Event.CANPLAYTHROUGH, console.log);
api.addEventListener(IOEvent.SUSPEND, console.log);
api.addEventListener(Event.PAUSE, console.log);
api.addEventListener(Event.SEEKING, console.log);
api.addEventListener(Event.SEEKED, console.log);
api.addEventListener(Event.SWITCHING, console.log);
api.addEventListener(Event.SWITCHED, console.log);
api.addEventListener(Event.RATECHANGE, console.log);
api.addEventListener(Event.TIMEUPDATE, console.log);
api.addEventListener(Event.VOLUMECHANGE, console.log);
api.addEventListener(IOEvent.LOAD, console.log);
api.addEventListener(MediaEvent.INFOCHANGE, console.log);
api.addEventListener(MediaEvent.STATSUPDATE, console.log);
api.addEventListener(MediaEvent.SEI, console.log);
api.addEventListener(MediaEvent.SCREENSHOT, onScreenshot);
api.addEventListener(SaverEvent.WRITERSTART, console.log);
api.addEventListener(SaverEvent.WRITEREND, console.log);
api.addEventListener(Event.ENDED, console.log);
api.addEventListener(Event.ERROR, console.error);
api.setup(container, {
    file: 'http://127.0.0.1/vod/sample.flv',
});

function onReady(e) {
    // ui.record('fragmented.mp4');
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
```

### Use the built-in extendible UI framework

```js
var events = odd.events,
    Event = events.Event,
    UIEvent = events.UIEvent,
    MouseEvent = events.MouseEvent;

var ui = odd.player.ui(0, { mode: 'file' });
ui.addEventListener(Event.READY, onReady);
ui.addEventListener(MouseEvent.CLICK, onClick);
ui.addEventListener(UIEvent.SHOOTING, console.log);
ui.addEventListener(UIEvent.FULLPAGE, console.log);
ui.addEventListener(UIEvent.FULLSCREEN, console.log);
ui.addEventListener(UIEvent.RESIZE, console.log);
ui.setup(container, {
    ...
    service: {
        script: 'js/sw.js',
        scope: 'js/',
        enable: false,
    },
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
```

### Add Callback

```js
api.onready = function(e) {
    // do something
};
```

Or:

```js
api.addEventListener('ready', onReady);

function onReady(e) {
    // do something
}
```

## Configuration

### Properties for SDK

```js
{
    airplay: 'allow',
    autoplay: false,
    dynamic: false,          // dynamic streaming
    bufferLength: 0.3,       // sec.
    file: '',
    lowlatency: true,        // ll-dash, ll-hls, ll-flv/fmp4 (auto reduce latency due to cumulative ack of tcp)
    maxBufferLength: 1.2,    // sec.
    maxPlaybackLength: 10,   // sec. for live mode only
    maxRetries: 0,           // maximum number of retries while some types of error occurs. -1 means always
    mode: 'live',            // live, vod
    module: '',              // SRC, FLV, FMP4, DASH, HLS, RTC, Flash
    muted: false,
    objectfit: 'contain',    // fill, contain, cover, none, scale-down
    playsinline: true,
    preload: 'none',         // none, metadata, auto
    retrying: 0,             // ms. retrying interval
    smoothing: false,        // smooth switching
    volume: 0.8,
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
    sources: [{              // ignored if "file" is presented
        file: '',
        module: '',
        label: '',
        default: false,
    }],
}
```

### Extension for UI

```js
{
    aspectratio: '',         // deprecated! 16:9 etc.
    skin: 'classic',
    plugins: [{
        kind: 'Poster',
        file: 'images/poster.png',
        cors: 'anonymous',   // anonymous, use-credentials
        objectfit: 'fill',   // fill, contain, cover, none, scale-down
        visibility: true,
    }, {
        kind: 'Danmu',
        speed: 100,
        lineHeight: 32,
        enable: true,
        visibility: true,
    }, {
        kind: 'Display',
        layout: '[Button:play=][Button:waiting=][Label:error=][Panel:info=][Panel:stats=]',
        ondoubleclick: 'fullscreen', // fullpage, fullscreen
        visibility: true,
    }, {
        kind: 'AD',
        visibility: true,
    }, {
        kind: 'Share',
        visibility: true,
    }, {
        kind: 'Logo',
        file: 'https://www.oddcancer.com/image/odd-player-logo.png',
        link: 'https://www.oddcancer.com/product/player.html',
        cors: 'anonymous',   // anonymous, use-credentials
        target: '_blank',
        style: 'margin: 3% 5%; width: 36px; height: 36px; top: 0px; right: 0px;',
        visibility: true,
    }, {
        kind: 'Controlbar',
        layout: '[Slider:timebar=Preview]|[Button:play=Play][Button:pause=Pause][Button:reload=Reload][Button:stop=Stop][Label:quote=Live broadcast][Label:time=00:00/00:00]||[Button:report=Report][Button:capture=Capture][Button:download=Download][Button:mute=Mute][Button:unmute=Unmute][Slider:volumebar=80][Select:definition=Definition][Button:danmuoff=Danmu Off][Button:danmuon=Danmu On][Button:fullpage=Fullpage][Button:exitfullpage=Exit Fullpage][Button:fullscreen=Fullscreen][Button:exitfullscreen=Exit Fullscreen]',
        autohide: false,
        visibility: true,
    }, {
        kind: 'ContextMenu',
        visibility: true,
        items: [{
            mode: '',        // '', featured, disable
            icon: 'image/github.png',
            text: 'github.com',
            shortcut: '',
            handler: function () { window.open('https://www.oddcancer.com/product/player.html'); },
        }],
    }]
};
```

### Config of Logger

```js
{
    level: 'log',    // debug, log, warn, error
    mode: 'console', // console, file, feedback
    maxLines: 60,
}
```

## API

### Statics of SDK

| Method | Arguments | Description |
| :--- | :--- | :--- |
| get | id = 0, option = undefined | Gets the SDK instance by id, create one if it doesn't exist. Option is the config of Logger. |
| create | option = undefined | Creates an API instance with an auto-increased id, or return the one already exist. Option is the config of Logger. |

### API of SDK Instance

| Method | Arguments | Description |
| :--- | :--- | :--- |
| setup | container, config | Setup the SDK with the given configuration. |
| play | url = '', options = null | Plays the specified media file or live stream, or the current item of the sources if the url doesn't provided. |
| pause |  | Pauses playing. Calling this method does nothing if the video is already paused. |
| seek | offset | Seeks the keyframe (also called an I-frame in the video industry) closest to the specified location. |
| stop |  | Stops playing, sets the time property to 0. |
| reload |  | Releases all the resources, reloads the media file or live stream. |
| muted | status | Mutes or unmutes the audio/video elements, if status is a boolean. Otherwise, returns the current status. |
| volume | f | Sets volume, which in the range of 0 to 1, if f is a number. Otherwise, returns the current volume. |
| definition | index | Switches to the specified definition, if index is a number. Otherwise, returns the current definition. |
| capture | width, height, mime | Captures the current frame, dispatches an screenshot event, and returns the image. |
| record | filename | Records a stream once the ServiceWorker is activated, and returns a StreamWriter. The current writer will be closed if filename equals false. |
| element |  | Gets the current rendering element, such as video, flash, canvas, etc. |
| getProperty | key | Gets property by key. Currently, key could be "info" and "stats". |
| duration |  | Gets the media duration. |
| state |  | Gets the player state. |
| destroy |  | Destroy this instance, removes dom elements. |

### Statics of UI

| Method | Arguments | Description |
| :--- | :--- | :--- |
| get | id = 0, option = undefined | Gets the UI instance by id, create one if it doesn't exist. Option is the config of Logger. |
| create | option = undefined | Create an UI instance with an auto-increment id, or return the one already exist. Option is the config of Logger. |

### API of UI Instance

Note: All of the SDK methods are also supported by UI.

| Method | Arguments | Description |
| :--- | :--- | :--- |
| setup | container, config | Setup the UI with the given configuration. |
| danmu | enable | Enables or disables the danmu plugin, if enable is a boolean. Otherwise, returns the current status. |
| shoot | text, data = null | Shoots the text with the data binded to. |
| displayAD | element | Displays the AD element. |
| removeAD |  | Removes the AD element. |
| fullpage | status | Requests or exits fullpage, if status is a boolean. Otherwise, returns the current status. |
| fullscreen | status | Requests or exits fullscreen, if status is a boolean. Otherwise, returns the current status. |
| resize |  | Resizes the player to fit to the parent node. However, if aspectratio is set, such as '16:9', the height will be calculated. |
| destroy | | Destroy this instance, removes dom elements. |

## Events

The SDK supports Event and IOEvent. All of the SDK events will be forward to UI.

### Event

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| READY |  | The ready event occurs when a module is ready. |
| PLAY |  | The play event occurs when it has been started or is no longer paused. |
| WAITING |  | The waiting event occurs when it stops because it needs to buffer the next frame. |
| DURATIONCHANGE | duration | The durationchange event occurs when the duration data is changed. |
| LOADEDMETADATA | metadata | The loadedmetadata event occurs when metadata has been loaded. |
| LOADEDDATA |  | The loadeddata event occurs when data for the current frame is loaded, but not enough data to play next frame. |
| CANPLAY |  | The canplay event occurs when the browser can start playing (when it has buffered enough to begin). |
| PLAYING |  | The playing event occurs when it is playing after having been paused or stopped for buffering. |
| CANPLAYTHROUGH |  | The canplaythrough event occurs when the browser estimates it can play through the specified media without having to stop for buffering. |
| PAUSE | timestamp | The pause event occurs when it is paused either by the user or programmatically. |
| SEEKING | timestamp | The seeking event occurs when the user starts moving/skipping to a new position. |
| SEEKED | timestamp | The seeked event occurs when the user is finished moving/skipping to a new position. |
| SWITCHING | index | The switching event occurs when the user starts switching to a different definition. |
| SWITCHED | index | The switching event occurs when the user is finished switching to a different definition. |
| RATECHANGE| rate | The ratechange event occurs when the playing speed is changed, which is invoked by the playbackRate method. |
| TIMEUPDATE | timestamp, buffered | The timeupdate event occurs when the playing position has changed. |
| VOLUMECHANGE | volume | The volumechange event occurs each time the volume has been changed. |
| ENDED |  | The ended event occurs when the media has reached the end. |
| ERROR | code, message | The error event occurs when an error occurred. |

### IOEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| LOADSTART |  | The loadstart event occurs when the browser starts loading. |
| STALLED |  | The stalled event occurs when the browser is trying to get media data, but data is not available. |
| ABORT |  | The abort event occurs when the loading is aborted. |
| TIMEOUT |  | The timeout event occurs when progression is terminated due to preset time expiring. |
| PROGRESS | loaded, total, buffer | The progress event occurs when the browser is downloading. |
| SUSPEND |  | The suspend event occurs when the browser is intentionally not getting media data. |
| LOAD |  | The load event occurs when an object has been loaded. |
| LOADEND |  | The loadend event occurs when a request has completed, whether successfully (after load) or unsuccessfully (after abort or error). |

### MediaEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| INFOCHANGE | info | The infochange event occurs when the meida info is changed. |
| STATSUPDATE | stats | The statsupdate event occurs when the media stats is changed. |
| SEI | packet, nalu | The sei event occurs when a SEI NalUnit is detected. |
| SCREENSHOT | image | The screenshot event occurs when an image is captured. |

### UIEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| SHOOTING | text, data | The shooting event occurs when a damnu message is shot. |
| FULLPAGE | status | The fullpage event occurs when the fullpage status is changed. |
| FULLSCREEN | status | The fullscreen event occurs when the fullscreen status is changed. |
| RESIZE | width, height | The resize event occurs when the UI is resized. |

### GlobalEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| CHANGE | name, value | The change event occurs when the value of the named target is changed. |
| VISIBILITYCHANGE | name, state | The visibilitychange event occurs when the visibility of the named target is changed. The state could be "visible" "hidden". |

### MouseEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| CLICK | name, value | The click event occurs when the user clicked the named target. |
| DOUBLE_CLICK | name, state | The doubleclick event occurs when the user double clicked the named target. |
| MOUSE_MOVE | name, value | The mousemove event occurs when the mouse is moved upon the named target. |

### KeyboardEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| KEY_DOWN | code, alt, control, shift, command | The keydown event occurs when the key is pressed. |
| KEY_UP | code, alt, control, shift, command | The keyup event occurs when the key is released. |

### TimerEvent

| Type | Properties | Meaning |
| :--- | :--- | :--- |
| TIMER | | The timer event occurs when the timer clock. |
| COMPLETE | | The complete event occurs when the timer is completed. |

## License

BSD 3-Clause License ([NOTICE](https://github.com/oddcancer/odd.js/blob/master/NOTICE))
