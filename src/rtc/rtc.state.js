(function (odd) {
    var RTC = odd.RTC,

        State = {
            INITIALIZED: 'initialized',
            CONNECTED: 'connected',
            PUBLISHING: 'publishing',
            PLAYING: 'playing',
            CLOSING: 'closing',
            CLOSED: 'closed',
        };

    RTC.State = State;
})(odd);

