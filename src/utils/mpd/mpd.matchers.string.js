(function (odd) {
    var utils = odd.utils,
        matchers = utils.MPD.matchers,

        attributes = {
            'MPD': ['id', 'profiles'],
            'Period': ['id'],
            'BaseURL': ['serviceLocation', 'byteRange'],
            'SegmentBase': ['indexRange'],
            'Initialization': ['range'],
            'RepresentationIndex': ['range'],
            'SegmentList': ['indexRange'],
            'BitstreamSwitching': ['range'],
            'SegmentURL': ['mediaRange', 'indexRange'],
            'SegmentTemplate': ['indexRange', 'media', 'index', 'initialization', 'bitstreamSwitching'],
            'AssetIdentifier': ['value', 'id'],
            'EventStream': ['value'],
            'AdaptationSet': ['profiles', 'mimeType', 'segmentProfiles', 'codecs', 'contentType'],
            'FramePacking': ['value', 'id'],
            'AudioChannelConfiguration': ['value', 'id'],
            'ContentProtection': ['value', 'id'],
            'EssentialProperty': ['value', 'id'],
            'SupplementalProperty': ['value', 'id'],
            'InbandEventStream': ['value', 'id'],
            'Accessibility': ['value', 'id'],
            'Role': ['value', 'id'],
            'Rating': ['value', 'id'],
            'Viewpoint': ['value', 'id'],
            'ContentComponent': ['contentType'],
            'Representation': ['id', 'dependencyId', 'mediaStreamStructureId'],
            'Subset': ['id'],
            'Metrics': ['metrics'],
            'Reporting': ['value', 'id']
        };

    matchers.string = function () {
        var _this = this;

        function _init() {

        }

        _this.test = function (attr, name) {
            if (attributes.hasOwnProperty(name)) {
                var attrNames = attributes[name];
                if (attrNames !== undefined) {
                    return attrNames.indexOf(attr.name) >= 0;
                } else {
                    return false;
                }
            }

            return false;
        };

        _this.exec = function (str) {
            return String(str);
        };

        _init();
    };
})(odd);

