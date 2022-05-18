(function (odd) {
    var RTC = odd.RTC,

        Signal = {
            CONNECT: 'connect',
            CREATE: 'create',
            PLAY: 'play',
            STOP: 'stop',
            SDP: 'sdp',
            CANDIDATE: 'candidate',
            RELEASE: 'release',
            STATUS: 'status',
        };

    RTC.Signal = Signal;
})(odd);

