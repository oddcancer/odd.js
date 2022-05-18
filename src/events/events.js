(function (odd) {
    var events = {},

        Event = {
            BIND: 'bind',
            READY: 'ready',
            PLAY: 'play',
            WAITING: 'waiting',
            DURATIONCHANGE: 'durationchange', // duration
            LOADEDMETADATA: 'loadedmetadata', // metadata
            LOADEDDATA: 'loadeddata',
            CANPLAY: 'canplay',
            PLAYING: 'playing',
            CANPLAYTHROUGH: 'canplaythrough',
            PAUSE: 'pause',                   // timestamp
            SEEKING: 'seeking',               // timestamp
            SEEKED: 'seeked',                 // timestamp
            SWITCHING: 'switching',           // index
            SWITCHED: 'switched',             // index
            RATECHANGE: 'ratechange',         // rate
            TIMEUPDATE: 'timeupdate',         // timestamp, buffered
            VOLUMECHANGE: 'volumechange',     // volume
            ENDED: 'ended',
            ERROR: 'error',                   // name, message
            RELEASE: 'release',
            CLOSE: 'close',                   // reason
        },

        IOEvent = {
            LOADSTART: 'loadstart',
            OPEN: 'open',
            PROGRESS: 'progress',   // loaded, total, buffer
            SUSPEND: 'suspend',
            STALLED: 'stalled',
            ABORT: 'abort',
            TIMEOUT: 'timeout',
            LOAD: 'load',
            LOADEND: 'loadend',
        },

        MediaEvent = {
            PACKET: 'packet',                           // packet
            INFOCHANGE: 'infochange',                   // info
            STATSUPDATE: 'statsupdate',                 // stats
            AAC_SPECIFIC_CONFIG: 'aac-specific-config', // packet
            AAC_SAMPLE: 'aac-sample',                   // packet
            AVC_CONFIG_RECORD: 'avc-config-record',     // packet
            AVC_SAMPLE: 'avc-sample',                   // packet
            SEI: 'sei',                                 // packet, nalu
            END_OF_STREAM: 'end-of-stream',             // packet
            SCREENSHOT: 'screenshot',                   // image
        },

        MediaStreamTrackEvent = {
            ADDTRACK: 'addtrack',       // track
            REMOVETRACK: 'removetrack', // track
        },

        NetStatusEvent = {
            NET_STATUS: 'netstatus', // level, code, description, info
        },

        SaverEvent = {
            RIGISTER: 'register',
            UNRIGISTER: 'unregister',
            WRITERSTART: 'writerstart', // writer
            WRITEREND: 'writerend',     // writer
        },

        UIEvent = {
            SHOOTING: 'shooting',     // text, data
            FULLPAGE: 'fullpage',     // status
            FULLSCREEN: 'fullscreen', // status
            RESIZE: 'resize',         // width, height
        },

        GlobalEvent = {
            CHANGE: 'change',                     // name, value
            VISIBILITYCHANGE: 'visibilitychange', // name, state=visible;hidden
        },

        // alt, control, shift, command
        MouseEvent = {
            CLICK: 'click',              // name
            DOUBLE_CLICK: 'doubleclick', // name
            MOUSE_MOVE: 'mousemove',     // name, value
        },

        KeyboardEvent = {
            KEY_DOWN: 'keydown', // keyCode, altKey, ctrlKey, shiftKey, metaKey
            KEY_UP: 'keyup',     // keyCode, altKey, ctrlKey, shiftKey, metaKey
        },

        TimerEvent = {
            TIMER: 'timer',
            COMPLETE: 'complete',
        },

        Level = {
            STATUS: 'status',
            WARNING: 'warning',
            ERROR: 'error',
        },

        Code = {
            NETCONNECTION_CALL_FAILED: 'NetConnection.Call.Failed',
            NETCONNECTION_CALL_SUCCESS: 'NetConnection.Call.Success',
            NETCONNECTION_CONNECT_APPSHUTDOWN: 'NetConnection.Connect.AppShutdown',
            NETCONNECTION_CONNECT_CLOSED: 'NetConnection.Connect.Closed',
            NETCONNECTION_CONNECT_FAILED: 'NetConnection.Connect.Failed',
            NETCONNECTION_CONNECT_IDLETIMEOUT: 'NetConnection.Connect.IdleTimeout',
            NETCONNECTION_CONNECT_INVALIDAPP: 'NetConnection.Connect.InvalidApp',
            NETCONNECTION_CONNECT_REJECTED: 'NetConnection.Connect.Rejected',
            NETCONNECTION_CONNECT_SUCCESS: 'NetConnection.Connect.Success',
            NETCONNECTION_PROXY_NOTRESPONDING: 'NetConnection.Proxy.NotResponding',

            NETGROUP_CONNECT_CLOSED: "NetGroup.Connect.Closed",
            NETGROUP_CONNECT_FAILED: "NetGroup.Connect.Failed",
            NETGROUP_CONNECT_REJECTED: "NetGroup.Connect.Rejected",
            NETGROUP_CONNECT_SUCCESS: "NetGroup.Connect.Success",
            NETGROUP_LOCALCOVERAGE_NOTIFY: "NetGroup.LocalCoverage.Notify",
            NETGROUP_MULTICASTSTREAM_PUBLISHNOTIFY: "NetGroup.MulticastStream.PublishNotify",
            NETGROUP_MULTICASTSTREAM_UNPUBLISHNOTIFY: "NetGroup.MulticastStream.UnpublishNotify",
            NETGROUP_NEIGHBOR_CONNECT: "NetGroup.Neighbor.Connect",
            NETGROUP_NEIGHBOR_DISCONNECT: "NetGroup.Neighbor.Disconnect",
            NETGROUP_POSTING_NOTIFY: "NetGroup.Posting.Notify",
            NETGROUP_REPLICATION_FETCH_FAILED: "NetGroup.Replication.Fetch.Failed",
            NETGROUP_REPLICATION_FETCH_RESULT: "NetGroup.Replication.Fetch.Result",
            NETGROUP_REPLICATION_FETCH_SENDNOTIFY: "NetGroup.Replication.Fetch.SendNotify",
            NETGROUP_REPLICATION_REQUEST: "NetGroup.Replication.Request",
            NETGROUP_SENDTO_NOTIFY: "NetGroup.SendTo.Notify",

            NETSTREAM_BUFFER_EMPTY: 'NetStream.Buffer.Empty',
            NETSTREAM_BUFFER_FLUSH: 'NetStream.Buffer.Flush',
            NETSTREAM_BUFFER_FULL: 'NetStream.Buffer.Full',
            NETSTREAM_FAILED: 'NetStream.Failed',
            NETSTREAM_PAUSE_NOTIFY: 'NetStream.Pause.Notify',
            NETSTREAM_PLAY_FAILED: 'NetStream.Play.Failed',
            NETSTREAM_PLAY_FILESTRUCTUREINVALID: 'NetStream.Play.FileStructureInvalid',
            NETSTREAM_PLAY_PUBLISHNOTIFY: 'NetStream.Play.PublishNotify',
            NETSTREAM_PLAY_RESET: 'NetStream.Play.Reset',
            NETSTREAM_PLAY_START: 'NetStream.Play.Start',
            NETSTREAM_PLAY_STOP: 'NetStream.Play.Stop',
            NETSTREAM_PLAY_STREAMNOTFOUND: 'NetStream.Play.StreamNotFound',
            NETSTREAM_PLAY_UNPUBLISHNOTIFY: 'NetStream.Play.UnpublishNotify',
            NETSTREAM_PUBLISH_BADNAME: 'NetStream.Publish.BadName',
            NETSTREAM_PUBLISH_DENIED: 'NetStream.Publish.Denied',
            NETSTREAM_PUBLISH_IDLE: 'NetStream.Publish.Idle',
            NETSTREAM_PUBLISH_START: 'NetStream.Publish.Start',
            NETSTREAM_RECORD_ALREADYEXISTS: 'NetStream.Record.AlreadyExists',
            NETSTREAM_RECORD_FAILED: 'NetStream.Record.Failed',
            NETSTREAM_RECORD_NOACCESS: 'NetStream.Record.NoAccess',
            NETSTREAM_RECORD_START: 'NetStream.Record.Start',
            NETSTREAM_RECORD_STOP: 'NetStream.Record.Stop',
            NETSTREAM_SEEK_FAILED: 'NetStream.Seek.Failed',
            NETSTREAM_SEEK_INVALIDTIME: 'NetStream.Seek.InvalidTime',
            NETSTREAM_SEEK_NOTIFY: 'NetStream.Seek.Notify',
            NETSTREAM_STEP_NOTIFY: 'NetStream.Step.Notify',
            NETSTREAM_UNPAUSE_NOTIFY: 'NetStream.Unpause.Notify',
            NETSTREAM_UNPUBLISH_SUCCESS: 'NetStream.Unpublish.Success',
            NETSTREAM_VIDEO_DIMENSIONCHANGE: 'NetStream.Video.DimensionChange',
        };

    events.Event = Event;
    events.IOEvent = IOEvent;
    events.MediaEvent = MediaEvent;
    events.MediaStreamTrackEvent = MediaStreamTrackEvent;
    events.NetStatusEvent = NetStatusEvent;
    events.SaverEvent = SaverEvent;
    events.UIEvent = UIEvent;
    events.GlobalEvent = GlobalEvent;
    events.MouseEvent = MouseEvent;
    events.KeyboardEvent = KeyboardEvent;
    events.TimerEvent = TimerEvent;
    events.Level = Level;
    events.Code = Code;
    odd.events = events;
})(odd);

