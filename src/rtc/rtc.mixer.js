(function (odd) {
    var RTC = odd.RTC,

        Mixer = {},
        State = {
            INITIALIZED: 'initialized',
            RUNNING: 'running',
            CLOSING: 'closing',
            CLOSED: 'closed',
        };

    Mixer.State = State;
    RTC.Mixer = Mixer;
})(odd);

