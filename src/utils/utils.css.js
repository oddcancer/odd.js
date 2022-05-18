(function (odd) {
    var utils = odd.utils,

        sheet;

    function css(selector, styles) {
        if (!sheet) {
            sheet = _createStylesheet();
        }

        var rules = '';
        utils.foreach(styles, function (style, value) {
            rules += style + ': ' + value + '; ';
        });

        try {
            if (sheet.insertRule) {
                sheet.insertRule(selector + ' { ' + rules + '}', sheet.cssRules.length);
            } else {
                sheet.addRule(selector, rules, sheet.rules.length);
            }
        } catch (err) {
            throw { name: 'AbortError', message: 'Failed to insert css rule ' + selector + ': ' + err };
        }
    }

    css.style = function (elements, styles, immediate) {
        if (elements === undefined || elements === null) {
            return;
        }

        if (elements.length === undefined) {
            elements = [elements];
        }

        var rules = utils.extendz({}, styles);
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            if (element === undefined || element === null) {
                continue;
            }

            utils.forEach(rules, function (style, value) {
                var name = _getStyleName(style);
                if (element.style[name] !== value) {
                    element.style[name] = value;
                }
            });
        }
    };

    function _createStylesheet() {
        var styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(styleSheet);
        return styleSheet.sheet || styleSheet.styleSheet;
    }

    function _getStyleName(name) {
        name = name.split('-');
        for (var i = 1; i < name.length; i++) {
            name[i] = name[i].charAt(0).toUpperCase() + name[i].slice(1);
        }

        return name.join('');
    }

    utils.css = css;
})(odd);

