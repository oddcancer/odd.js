(function (odd) {
    var utils = odd.utils,

        re = /^(([a-z]+\:)\/\/(([-a-z\d\.]+)(?:\:(\d+))?))((?:\/[-_a-z\d\s\.]*)*)([?#][-_+=:/@#%&?a-z\d\s\.]+)?$/i;

    function URL(url) {
        var _this = this;

        function _init() {
            _this.href = '';
            _this.origin = '';
            _this.protocol = '';
            _this.host = '';
            _this.hostname = '';
            _this.port = '';
            _this.pathname = '';
            _this.filename = '';
            _this.filetype = '';
            _this.search = '';
            _this.hash = '';

            if (url) {
                _this.parse(url);
            }
        }

        _this.parse = function (url) {
            _this.href = url;
            if (/^([a-z]+)\:\/\//i.test(url) === false) {
                _this.href = window.location.origin + (url.substr(0, 1) === '/' ? '' : '/') + url;
            }

            var arr = _this.href.match(re);
            if (arr === null) {
                throw { name: 'SyntaxError', message: 'The URL did not match the expected pattern, url=' + url + '.' };
            }

            _this.origin = arr[1];
            _this.protocol = arr[2];
            _this.host = arr[3];
            _this.hostname = arr[4];
            _this.port = arr[5] || '';
            _this.pathname = arr[6] || '';

            var tmp = _this.pathname.match(/\/(.+?)(?:\.([a-z\d]+))?$/i);
            if (tmp) {
                _this.filename = tmp[1];
                _this.filetype = tmp[2];
            }

            if (arr[7]) {
                if (arr[7].substr(0, 1) === '?') {
                    _this.search = arr[7];
                } else {
                    _this.hash = arr[7];
                }
            }
        };

        _init();
    }

    utils.URL = URL;
})(odd);

