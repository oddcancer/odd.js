(function (odd) {
    var utils = odd.utils,

        NodeType = {
            ELEMENT_NODE: 1,
            TEXT_NODE: 3,
            CDATA_SECTION_NODE: 4,
            COMMENT_NODE: 8,
            DOCUMENT_NODE: 9,
        },
        _default = {
            ignoreRoot: true,
            trimWhitespaces: false,
            attributePrefix: '@',
            matchers: [],
        };

    function XML2JSON(config, logger) {
        var _this = this,
            _logger = logger;

        function _init() {
            _this.config = utils.extendz({}, _default, config);
        }

        _this.parse = function (str) {
            var xml;

            if (window.DOMParser) {
                var parser = new DOMParser();

                try {
                    xml = parser.parseFromString(str, 'text/xml');
                } catch (err) {
                    _logger.error('Failed to parse XML structure.');
                    return null;
                }
            } else {
                if (str.indexOf('<?') === 0) {
                    str = str.substr(str.indexOf('?>') + 2);
                }

                xml = new ActiveXObject('Microsoft.XMLDOM');
                xml.async = 'false';
                xml.loadXML(str);
            }

            return _parseNode(xml);
        };

        function _parseNode(node, path) {
            var data = {};

            if (node.nodeType === NodeType.DOCUMENT_NODE) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];
                    var name = _getNodeName(child);

                    if (child.nodeType === NodeType.ELEMENT_NODE) {
                        element = _parseNode(child);
                        element.parent = data;

                        if (_this.config.ignoreRoot) {
                            delete element.parent;
                            data = element;
                        } else {
                            data[name] = element;
                        }
                    }
                }

                return data;
            }

            if (node.nodeType === NodeType.ELEMENT_NODE) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];
                    var name = _getNodeName(child);

                    if (child.nodeType === NodeType.COMMENT_NODE) {
                        continue;
                    }

                    var childPath = path + '.' + name;
                    var element = _parseNode(child, childPath);
                    element.parent = data;

                    if (data.hasOwnProperty(name)) {
                        if (utils.typeOf(data[name]) != 'array') {
                            data[name] = [data[name]];
                        }

                        data[name].push(element);
                    } else {
                        if (name != '#text' || /[^\s]/.test(element)) { // Don't add white-space text nodes
                            data[name] = element;
                        }
                    }
                }

                // Attributes
                var name = _getNodeName(node);

                // Node namespace prefix
                if (node.prefix != null && node.prefix != '') {
                    name = node.prefix + ':' + name;
                }

                for (var i = 0; i < node.attributes.length; i++) {
                    var attr = node.attributes[i];
                    var value = attr.value;

                    for (var j = 0; j < _this.config.matchers.length; j++) {
                        var matcher = _this.config.matchers[j];
                        if (matcher.test(attr, name)) {
                            value = matcher.exec(attr.value);
                        }

                        data[_this.config.attributePrefix + attr.name] = value;
                    }
                }

                if (data['#text'] != null) {
                    if (_this.config.trimWhitespaces) {
                        data['#text'] = data['#text'].trim();
                    }
                }

                if (data['#cdata-section'] != null) {

                }

                data.toString = function () {
                    return (data['#text'] == null ? '' : data['#text']) + (data['#cdata-section'] == null ? '' : data['#cdata-section']);
                };

                return data;
            }

            if (node.nodeType === NodeType.TEXT_NODE || node.nodeType === NodeType.CDATA_SECTION_NODE) {
                return node.nodeValue;
            }
        }

        function _getNodeName(node) {
            return node.localName || node.baseName || node.nodeName;
        }

        _init();
    }

    XML2JSON.prototype.CONF = _default;

    utils.XML2JSON = XML2JSON;
})(odd);

