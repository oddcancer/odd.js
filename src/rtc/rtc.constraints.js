(function (odd) {
    var RTC = odd.RTC,

        Constraints = {
            '1080P_1': {
                audio: {
                    sampleRate: 192,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 1920,
                    height: 1080,
                    frameRate: 15,
                    maxBitrate: 2000,
                },
            },
            '1080P_2': {
                audio: {
                    sampleRate: 192,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 1920,
                    height: 1080,
                    frameRate: 30,
                    maxBitrate: 2800,
                },
            },
            '720P_1': {
                audio: {
                    sampleRate: 128,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 1280,
                    height: 720,
                    frameRate: 15,
                    maxBitrate: 1200,
                },
            },
            '720P_2': {
                audio: {
                    sampleRate: 128,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 1280,
                    height: 720,
                    frameRate: 30,
                    maxBitrate: 1600,
                },
            },
            '540P_1': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 960,
                    height: 540,
                    frameRate: 15,
                    maxBitrate: 600,
                },
            },
            '540P_2': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 960,
                    height: 540,
                    frameRate: 30,
                    maxBitrate: 900,
                },
            },
            '480P_1': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 854,
                    height: 480,
                    frameRate: 15,
                    maxBitrate: 500,
                },
            },
            '480P_2': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 854,
                    height: 480,
                    frameRate: 30,
                    maxBitrate: 800,
                },
            },
            '360P_1': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 640,
                    height: 360,
                    frameRate: 15,
                    maxBitrate: 400,
                },
            },
            '360P_2': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 640,
                    height: 360,
                    frameRate: 24,
                    maxBitrate: 600,
                },
            },
            '180P_1': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 16 / 9,
                    width: 320,
                    height: 180,
                    frameRate: 15,
                    maxBitrate: 200,
                },
            },
            '120P_1': {
                audio: {
                    sampleRate: 64,
                },
                video: {
                    aspectRatio: 4 / 3,
                    width: 160,
                    height: 120,
                    frameRate: 15,
                    maxBitrate: 65,
                },
            },
        };

    RTC.Constraints = Constraints;
})(odd);

