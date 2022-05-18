(function (odd) {
    var utils = odd.utils;

    function MPD(url) {
        var _this = this,
            _url,
            _mpd,
            _location,
            _baseURL;

        function _init() {
            _url = url || '';
        }

        _this.update = function (mpd) {
            // Location
            _location = _url;
            if (mpd.Location && mpd.Location['#text']) {
                _location = mpd.Location['#text']
            }

            // BaseURL
            _baseURL = mpd.BaseURL || _location.substring(0, _location.lastIndexOf('/') + 1);

            if (mpd['@type'] === 'dynamic') {
                _updatePeriod(mpd, _mpd);
            }

            _mpd = mpd;
        };

        function _updatePeriod(newMpd, oldMpd) {
            var start = 0;
            var duration = NaN;

            if (utils.typeOf(newMpd.Period) != 'array') {
                newMpd.Period = [newMpd.Period];
            }

            for (var i = 0; i < newMpd.Period.length; i++) {
                var newPeriod = newMpd.Period[i];

                if (newPeriod.hasOwnProperty('@start')) {
                    start = newPeriod['@start'];
                } else if (!isNaN(duration)) {
                    start += duration;
                } else if (i === 0) {
                    if (newMpd['@type'] === 'dynamic') {
                        // TODO: Early Available Period
                    } else { // default: static
                        start = 0;
                    }
                }

                if (newPeriod.hasOwnProperty('@duration')) {
                    duration = newPeriod['@duration'];
                }

                newPeriod['@start'] = start;
                newPeriod['@duration'] = duration;

                var oldPeriod = _getPeriod(oldMpd, newPeriod);
                _updateAdaptationSet(newPeriod, oldPeriod);
            }
        }

        function _updateAdaptationSet(newPeriod, oldPeriod) {
            if (utils.typeOf(newPeriod.AdaptationSet) != 'array') {
                newPeriod.AdaptationSet = [newPeriod.AdaptationSet];
            }

            for (var i = 0; i < newPeriod.AdaptationSet.length; i++) {
                var newAdaptationSet = newPeriod.AdaptationSet[i];
                var oldAdaptationSet = _getAdaptationSet(oldPeriod, newAdaptationSet);
                _updateSegments(newAdaptationSet, oldAdaptationSet);
            }
        }

        function _updateSegments(newAdaptationSet, oldAdaptationSet) {
            var oldT = 0;
            var newT = 0;
            var newS = [];

            if (newAdaptationSet.SegmentTemplate.hasOwnProperty('SegmentTimeline') === false) {
                return;
            }

            if (oldAdaptationSet) {
                var oldSegmentTimeline = oldAdaptationSet.SegmentTemplate.SegmentTimeline;
                if (utils.typeOf(oldSegmentTimeline.S) != 'array') {
                    oldSegmentTimeline.S = [oldSegmentTimeline.S];
                }

                for (var i = 0; i < oldSegmentTimeline.S.length; i++) {
                    var s = oldSegmentTimeline.S[i];

                    if (i === 0 && s.hasOwnProperty('@t')) {
                        oldT = s['@t'];
                    }

                    oldT += s['@d'];
                    if (s['@r']) {
                        oldT += s['@d'] * s['@r'];
                    }

                    newS.push(utils.extendz({}, s));
                }
            }

            var newSegmentTimeline = newAdaptationSet.SegmentTemplate.SegmentTimeline;
            if (utils.typeOf(newSegmentTimeline.S) != 'array') {
                newSegmentTimeline.S = newSegmentTimeline.S ? [newSegmentTimeline.S] : [];
            }

            for (var i = 0; i < newSegmentTimeline.S.length; i++) {
                var s = newSegmentTimeline.S[i];

                if (i === 0 && s.hasOwnProperty('@t')) {
                    newT = s['@t'];
                }

                if (newT >= oldT) {
                    newS.push(s);
                }

                newT += s['@d'];
                if (s['@r']) {
                    newT += s['@d'] * s['@r'];
                }
            }
        }

        function _getPeriod(mpd, reference) {
            if (!mpd) {
                return undefined;
            }

            for (var i = 0; i < mpd.Period.length; i++) {
                var period = mpd.Period[i];

                if (period.hasOwnProperty('@id')) {
                    if (period['@id'] === reference['@id']) {
                        return period;
                    }
                } else if (period.hasOwnProperty('@start')) {
                    if (period['@start'] === reference['@start']) {
                        return period;
                    }
                } else {
                    return period; // Just return the first one.
                }
            }

            return undefined;
        }

        function _getAdaptationSet(period, reference) {
            if (!period) {
                return undefined;
            }

            for (var i = 0; i < period.AdaptationSet.length; i++) {
                var adaptationSet = period.AdaptationSet[i];

                if (adaptationSet.hasOwnProperty('@id')) {
                    if (adaptationSet['@id'] === reference['@id']) {
                        return adaptationSet;
                    }
                } else if (adaptationSet.hasOwnProperty('@contentType')) {
                    if (adaptationSet['@contentType'] === reference['@contentType']) {
                        return adaptationSet;
                    }
                } else if (adaptationSet.hasOwnProperty('@mimeType')) {
                    if (adaptationSet['@mimeType'] === reference['@mimeType']) {
                        return adaptationSet;
                    }
                } else if (adaptationSet.hasOwnProperty('@codecs')) {
                    if (adaptationSet['@codecs'] === reference['@codecs']) {
                        return adaptationSet;
                    }
                } else {
                    // Can't get content type straightly.
                    // TODO: Recognize @width, @height, @sar, @frameRate, etc. as video AdaptationSet.
                    break;
                }
            }

            return undefined;
        }

        _this.getSegmentInfo = function (time, type, isInitSegment, start, index, bandwidth) {
            var period = _getPeriodByTime(time);
            var adaptationSet = _getAdaptationSetByType(period, type);
            if (!adaptationSet) {
                return undefined;
            }

            var representation = _getRepresentationByBandwidth(adaptationSet, bandwidth);
            if (!representation) {
                return undefined;
            }

            var segmentTemplate = adaptationSet.SegmentTemplate;

            var url = segmentTemplate[isInitSegment ? '@initialization' : '@media'];
            var timescale = segmentTemplate['@timescale'] || 1;
            var duration = segmentTemplate['@duration'] || 0;

            url = url.replace(/\$RepresentationID\$/, representation['@id']);

            if (segmentTemplate['@media'].search(/\$Time\$/)) {
                var s, segmentTimeline = segmentTemplate.SegmentTimeline;
                if (isInitSegment) {
                    if (start > 0 || start === 0 && _mpd.hasOwnProperty('@suggestedPresentationDelay') === false) {
                        if (segmentTimeline.S.length) {
                            start = segmentTimeline.S[0]['@t'];
                        }
                    } else {
                        var delay = Math.abs(delay) || _mpd['@suggestedPresentationDelay'];
                        s = _getSegmentByDelay(segmentTimeline, delay * timescale);
                        if (s) {
                            start = s['@t'];
                            duration = s['@d'];
                        }
                    }
                } else {
                    s = _getSegmentByTime(segmentTimeline, start);
                    if (s === undefined) {
                        return undefined;
                    }

                    start = s['@t'];
                    duration = s['@d'];

                    url = url.replace(/\$Time\$/, start);
                }
            }

            if (segmentTemplate['@media'].search(/\$Number\$/)) {
                if (isInitSegment) {
                    index = segmentTemplate['@startNumber'];
                } else {
                    url = url.replace(/\$Number\$/, index);
                }
            }

            var baseURL = representation.baseURL || adaptationSet.baseURL || period.baseURL;
            url = (baseURL ? baseURL['#text'] : _baseURL) + url;

            return {
                mimeType: representation['@mimeType'] || adaptationSet['@mimeType'],
                codecs: representation['@codecs'] || adaptationSet['@codecs'],
                index: index,
                start: start,
                duration: duration,
                timescale: timescale,
                url: url
            };
        };

        function _getPeriodByTime(time) {
            var element = _mpd.Period[0];

            for (var i = 0; i < _mpd.Period.length; i++) {
                var period = _mpd.Period[i];

                if (period.hasOwnProperty('@start')) {
                    if (period['@start'] > element['@start'] && period['@start'] <= time) {
                        element = period;
                    }
                } else {
                    break; // Just return the first one.
                }
            }

            return element;
        }

        function _getAdaptationSetByType(period, type) {
            for (var i = 0; i < period.AdaptationSet.length; i++) {
                var adaptationSet = period.AdaptationSet[i];

                if (adaptationSet.hasOwnProperty('@contentType')) {
                    if (adaptationSet['@contentType'] === type) {
                        return adaptationSet;
                    }
                } else if (adaptationSet.hasOwnProperty('@mimeType')) {
                    var arr = adaptationSet['@mimeType'].match(/^([a-z]+)\/[a-z0-9]+/i);
                    if (arr && arr.length > 1 && arr[1] === type) {
                        return adaptationSet;
                    }
                }
            }

            return undefined;
        }

        function _getRepresentationByBandwidth(adaptationSet, bandwidth) {
            if (utils.typeOf(adaptationSet.Representation) != 'array') {
                adaptationSet.Representation = [adaptationSet.Representation];
            }

            var element = adaptationSet.Representation[0];

            for (var i = 0; i < adaptationSet.Representation.length; i++) {
                var representation = adaptationSet.Representation[i];
                if (representation['@bandwidth'] > element['@bandwidth'] && (!bandwidth || representation['@bandwidth'] <= bandwidth)) {
                    element = representation;
                }
            }

            return element;
        }

        function _getSegmentByDelay(segmentTimeline, delay) {
            for (var i = segmentTimeline.S.length - 1; i >= 0; i--) {
                var s = segmentTimeline.S[i];

                delay -= s['@d'] * (s['@r'] || 1);
                if (delay <= 0) {
                    var t = segmentTimeline.S[0]['@t'];

                    for (var j = 0; j < i; j++) {
                        t += segmentTimeline.S[j]['@d'];
                        if (s['@r']) {
                            t += s['@d'] * s['@r'];
                        }
                    }

                    s['@t'] = t;

                    return s;
                }
            }

            return segmentTimeline.S[0];
        }

        function _getSegmentByTime(segmentTimeline, start) {
            var t = NaN;

            for (; segmentTimeline.S.length;) {
                var s = segmentTimeline.S.shift();

                if (isNaN(t)) {
                    t = s['@t'] || 0;
                }

                if (t + s['@d'] * (s['@r'] || 0) >= start) {
                    s['@t'] = t;

                    if (segmentTimeline.S.length) {
                        segmentTimeline.S[0]['@t'] = s['@t'] + s['@d'];
                    }

                    return s;
                }

                t += s['@d'];
                if (s['@r']) {
                    t += s['@d'] * s['@r'];
                }
            }

            return undefined;
        }

        _this.getLocation = function () {
            return _location;
        };

        _init();
    }

    utils.MPD = MPD;
})(odd);

