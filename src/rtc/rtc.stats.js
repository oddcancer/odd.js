(function (odd) {
    var RTC = odd.RTC;

    function Stats(logger) {
        var _this = this,
            _logger = logger,
            _handlers;

        function _init() {
            _this.report = {
                'inbound-rtp': {
                    audio: {},
                    video: {},
                },
                'outbound-rtp': {
                    audio: {},
                    video: {},
                },
            };
            _handlers = {
                'inbound-rtp': _parseInboundRTP,
                'outbound-rtp': _parseOutboundRTP,
            };
        }

        _this.parse = function (stats) {
            var h = _handlers[stats.type];
            if (h) {
                h(_this.report[stats.type][stats.kind], stats);
            }
        };

        function _parseInboundRTP(dst, src) {
            dst.bytesPerSecond = src.bytesReceived - (dst.bytesReceived || 0);
            dst.bytesReceived = src.bytesReceived;
            dst.jitterBuffer = src.jitterBufferDelay / src.jitterBufferEmittedCount;
            dst.jitterBufferDelay = src.jitterBufferDelay;
            dst.jitterBufferEmittedCount = src.jitterBufferEmittedCount;
            dst.packetsLost = src.packetsLost;
            dst.packetsPerSecond = src.packetsReceived - (dst.packetsReceived || 0);
            dst.packetsReceived = src.packetsReceived;
            dst.timestamp = src.timestamp;
            switch (src.kind) {
                case 'audio':
                    dst.totalSamplesDuration = src.totalSamplesDuration;
                    dst.totalSamplesPerSecond = src.totalSamplesReceived - (dst.totalSamplesReceived || 0);
                    dst.totalSamplesReceived = src.totalSamplesReceived;
                    break;
                case 'video':
                    dst.frameHeight = src.frameHeight;
                    dst.frameWidth = src.frameWidth;
                    dst.framesDecoded = src.framesDecoded;
                    dst.framesDecodedPerSecond = src.framesDecoded - (dst.framesDecoded || 0);
                    dst.framesDropped = src.framesDropped;
                    dst.framesPerSecond = src.framesPerSecond;
                    dst.framesReceived = src.framesReceived;
                    dst.totalInterFrameDelay = src.totalInterFrameDelay;
                    break;
            }
        }

        function _parseOutboundRTP(dst, src) {
            dst.bytesPerSecond = src.bytesSent - (dst.bytesSent || 0);
            dst.bytesSent = src.bytesSent;
            dst.packetsPerSecond = src.packetsSent - (dst.packetsSent || 0);
            dst.packetsSent = src.packetsSent;
            dst.retransmittedBytesSent = src.retransmittedBytesSent;
            dst.retransmittedPacketsSent = src.retransmittedPacketsSent;
            dst.timestamp = src.timestamp;
            switch (src.kind) {
                case 'video':
                    dst.frameHeight = src.frameHeight;
                    dst.frameWidth = src.frameWidth;
                    dst.framesEncoded = src.framesEncoded;
                    dst.framesPerSecond = src.framesPerSecond;
                    dst.framesSent = src.framesSent;
                    dst.totalPacketSendDelay = src.totalPacketSendDelay;
                    break;
            }
        }

        _init();
    }

    RTC.Stats = Stats;
})(odd);

