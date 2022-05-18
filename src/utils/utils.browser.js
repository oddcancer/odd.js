(function (odd) {
    function UserAgent() {
        var _this = this,
            _agent;

        function _init() {
            _agent = navigator.userAgent;

            _this.OS = {
                name: '',
                version: '',
                major: NaN,
                minor: NaN,
            };
            _this.Kernel = {
                name: '',
                version: '',
                major: NaN,
                minor: NaN,
            };
            _this.Browser = {
                name: '',
                version: '',
                major: NaN,
                minor: NaN,
            };

            _detectOS();
            _detectModel();
            _detectKernel();
            _detectBrowser();
        }

        function _detectOS() {
            var arr = _isWindowsNT() ||
                _isMac() ||
                _isAndroid() ||
                _isIOS() ||
                _isWindowsPhone();
            if (arr) {
                _this.OS.name = arr[1] || '';
                _this.OS.version = (arr[2] || '').replace(/_/g, '.');
                _this.OS.major = parseInt(arr[3]);
                _this.OS.minor = parseInt(arr[4]);
            }

            _this.OS.isWindows = _this.OS.name === 'Windows';
            _this.OS.isMac = _this.OS.name === 'Mac';
            _this.OS.isAndroid = _this.OS.name === 'Android';
            _this.OS.isIOS = _this.OS.name === 'iPhone' || _this.OS.name === 'iPad' || _this.OS.name === 'iPod';
            _this.OS.isWindowsPhone = _this.OS.name === 'Windows Phone';
            _this.OS.isMobile = _this.OS.isAndroid || _this.OS.isIOS || _this.OS.isWindowsPhone;
            _this.OS.isHorizontal = _isHorizontal;
        }

        function _detectModel() {
            // Mozilla/5.0 (Linux;[ U;] Android 4.4.4;[ zh-cn;] G621-TL00[ Build/HonorG621-TL00[; wv]])
            var arr = _this.OS.isAndroid && _agent.match(/;\s(([-a-z\d\s]+)(?:\sBuild\/([-a-z\d\.\s]+))?)(?:;\swv|\))/i);
            if (arr) {
                _this.OS.model = arr[1];
                _this.OS.brand = arr[2];
                _this.OS.build = arr[3];
            }
        }

        function _detectKernel() {
            var arr = !_this.OS.isIOS && _isChrome() ||
                _isAppleWebKit() ||
                _isGecko() ||
                _isPresto() ||
                _isTrident();
            if (arr) {
                _this.Kernel.name = arr[1] || '';
                _this.Kernel.version = arr[2] || '';
                _this.Kernel.major = parseInt(arr[3]);
                _this.Kernel.minor = parseInt(arr[4]);
            }

            _this.Kernel.isChrome = _this.Kernel.name === 'Chrome';
            _this.Kernel.isAppleWebKit = _this.Kernel.name === 'AppleWebKit';
            _this.Kernel.isGecko = _this.Kernel.name === 'Gecko';
            _this.Kernel.isPresto = _this.Kernel.name === 'Presto';
            _this.Kernel.isTrident = _this.Kernel.name === 'Trident';
        }

        function _detectBrowser() {
            var arr = _isMSIE() ||
                _isIETrident() ||
                _isFirefox() ||
                _isOpera() ||
                _isUCBrowser() ||
                _isWeChat() ||
                _isQQ() ||
                _isQQBrowser() ||
                _isSogou() ||
                _is360() ||
                _isElectron() ||
                _isEdge() ||
                _isChrome() ||
                _isSafari() ||
                _isOtherBrowser();
            if (arr) {
                _this.Browser.name = arr[1] || '';
                _this.Browser.version = arr[2] || '';
                _this.Browser.major = parseInt(arr[3]);
                _this.Browser.minor = parseInt(arr[4]);
            }

            _this.Browser.isMSIE = _this.Browser.name === 'MSIE';
            _this.Browser.isIE8 = _this.Browser.name === 'MSIE' && _this.Browser.major === 8;
            _this.Browser.isIE9 = _this.Browser.name === 'MSIE' && _this.Browser.major === 9;
            _this.Browser.isIE10 = _this.Browser.name === 'MSIE' && _this.Browser.major === 10;
            _this.Browser.isIE11 = _this.Browser.name === 'Trident';
            _this.Browser.isIE = _this.Browser.isMSIE || _this.Browser.isIE11;
            _this.Browser.isFirefox = _this.Browser.name === 'Firefox';
            _this.Browser.isOpera = _this.Browser.name === 'OPR' || _this.Browser.name === 'OPiOS' || _this.Browser.name === 'Opera Mini';
            _this.Browser.isUCBrowser = _this.Browser.name === 'UCBrowser';
            _this.Browser.isWeChat = _this.Browser.name === 'MicroMessenger';
            _this.Browser.isQQ = _this.Browser.name === 'QQ';
            _this.Browser.isQQBrowser = _this.Browser.name === 'QQBrowser' || _this.Browser.name === 'MQQBrowser';
            _this.Browser.isSogou = _this.Browser.name === 'MetaSr' || _this.Browser.name === 'SogouMobileBrowser';
            _this.Browser.is360 = _this.Browser.name === 'QihooBrowser';
            _this.Browser.isElectron = _this.Browser.name === 'Electron';
            _this.Browser.isEdg = _this.Browser.name === 'Edg'; // Chrome like
            _this.Browser.isEdge = _this.Browser.name === 'Edge';
            _this.Browser.isEdgA = _this.Browser.name === 'EdgA';
            _this.Browser.isChrome = _this.Browser.name === 'Chrome';
            _this.Browser.isCriOS = _this.Browser.name === 'CriOS';
            _this.Browser.isSafari = _this.Browser.name === 'Safari';
            _this.Browser.flash = _getFlashVersion();
        }

        // OS
        function _isWindowsNT() {
            // Windows NT 10.0
            var arr = _agent.match(/(Windows)\sNT\s((\d+)\.(\d+))/);
            if (arr) {
                switch (arr[2]) {
                    case '6.3':
                        arr = ['Windows 8.1', 'Windows', '8.1', '8', '1'];
                        break;
                    case '6.2':
                        arr = ['Windows 8.0', 'Windows', '8.0', '8', '0'];
                        break;
                    case '6.1':
                        arr = ['Windows 7.0', 'Windows', '7.0', '7', '0'];
                        break;
                }
            }
            return arr;
        }

        function _isMac() {
            // Chrome/Safari: Mac OS X 10_6_8
            // FireFox: Mac OS X 10.6
            // Opera: Mac OS X 10.6.8
            return _agent.match(/(Mac)\sOS\sX\s((\d+)[\._](\d+)(?:[\._]\d+)*)/);
        }

        function _isAndroid() {
            // Mobile/Tablet: Android 4.1.2
            // FireFox on Mobile: Android
            return _agent.match(/(Android)(?:\s((\d+)(?:\.(\d+))?(?:\.(\d+))*))?/);
        }

        function _isIOS() {
            // Chrome: iPhone; CPU iPhone OS 8_0_2
            // Safari: iPhone; CPU iPhone OS 8_0_2
            // Safari: iPhone; CPU iPhone 5_0
            // Safari: iPad; CPU OS 5_0
            // Safari: iPod; CPU iPhone OS 5_1_1
            return _agent.match(/(iP(?:hone|ad|od)).*\s((\d+)_(\d+)(?:_\d+)*)/);
        }

        function _isWindowsPhone() {
            // Windows Phone OS 7.0
            // Windows Phone 8.0
            return _agent.match(/(Windows\sPhone)(?:\sOS)?\s((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        // Browser
        function _isMSIE() {
            // MSIE 10.0
            return _agent.match(/(MSIE)\s((\d+)\.(\d+))/);
        }

        function _isIETrident() {
            // Trident/7.0; xxx rv:11.0
            return _agent.match(/(Trident)\/.+rv:((11)\.(\d+))/i);
        }

        function _isFirefox() {
            // Firefox/77.0
            return _agent.match(/(Firefox)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isOpera() {
            // OPR/69.0.3686.57
            // OPiOS/16.0.8.121059
            // Opera/9.8 (Android; Opera Mini/36.2.2254/119.127; U; en) Presto/2.12.423 Version/12.16
            return _agent.match(/(OPR|OPiOS|Opera\sMini)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isUCBrowser() {
            // UCBrowser/18.0.1025.166
            return _agent.match(/(UCBrowser)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isWeChat() {
            // MicroMessenger/6.5.6
            return _agent.match(/(MicroMessenger)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isQQ() {
            // QQ/7.0.0.3135
            return _agent.match(/(QQ)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isQQBrowser() {
            // QQBrowser/10.6.4163.400
            // MQQBrowser/10.7.1
            return _agent.match(/([M]?QQBrowser)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isSogou() {
            // MetaSr 1.0
            // SogouMobileBrowser/5.22.0
            return _agent.match(/(MetaSr|SogouMobileBrowser)[\s\/]((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _is360() {
            // QihooBrowser/4.0.13
            // 360browser
            return _agent.match(/(QihooBrowser|360browser)(?:\/((\d+)\.(\d+)(?:\.\d+)*))?/);
        }

        function _isElectron() {
            return _agent.match(/(Electron)(?:\/((\d+)\.(\d+)(?:\.\d+)*))?/);
        }

        function _isEdge() {
            // Edg/84.0.522.48 (New Edge)
            // Edge/17.17134 (Old Edge)
            // EdgA/42.0.0.2741 (Edge on Android)
            return _agent.match(/(Edg|Edge|EdgA)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isChrome() {
            // Chrome/83.0.4103.116
            // CriOS/27.0.1453.10
            return _agent.match(/(Chrome|CriOS)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isSafari() {
            if (_this.OS.isAndroid || _isChrome() || !_agent.match(/Safari/)) {
                return null;
            }
            var arr = _agent.match(/Version\/((\d+)\.(\d+)(?:\.\d+)*)/);
            if (arr) {
                return ['Safari/' + arr[1], 'Safari'].concat(arr.slice(1));
            }
            return null;
        }

        function _isOtherBrowser() {
            // baidubrowser/6.0.15.0
            // Mb2345Browser/9.0.1
            // K9Browser/19.0.0
            // Vivaldi/1.94.1008.40$
            return _agent.match(/\s([a-z\d]+Browser)\/((\d+)\.(\d+)(?:\.\d+)*)/i) ||
                _agent.match(/\s([a-z\d]+)\/((\d+)\.(\d+)(?:\.\d+)*)$/i);
        }

        // Kernel
        function _isAppleWebKit() {
            // AppleWebKit/605.1.15
            return _agent.match(/(AppleWebKit)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isGecko() {
            // Gecko/20100101
            // Gecko/66.0
            return _agent.match(/(Gecko)\/((\d+)(?:\.(\d+))?(?:\d+)*)/);
        }

        function _isPresto() {
            // Presto/2.12.423
            return _agent.match(/(Presto)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _isTrident() {
            // Trident/7.0
            return _agent.match(/(Trident)\/((\d+)\.(\d+)(?:\.\d+)*)/);
        }

        function _getFlashVersion() {
            if (!_this.isWindows) {
                return 0;
            }

            var plugins = navigator.plugins;
            if (plugins) {
                var flash = plugins['Shockwave Flash'];
                if (flash && flash.description) {
                    var version = flash.description.replace(/\D+(\d+\.?\d*).*/, '$1');
                    return parseFloat(version);
                }
            }

            if (typeof window.ActiveXObject !== 'undefined') {
                try {
                    var flash = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                    if (flash) {
                        var version = flash.GetVariable('$version').split(' ')[1].replace(/\s*,\s*/, '.')
                        return parseFloat(version);
                    }
                } catch (err) { }
            }

            return 0;
        }

        function _isHorizontal() {
            if (window.orientation !== undefined) {
                return (window.orientation === 90 || window.orientation === -90);
            }
            return window.innerWidth > window.innerHeight;
        }

        _init();
    }

    var userAgent = new UserAgent();
    odd.OS = userAgent.OS;
    odd.Kernel = userAgent.Kernel;
    odd.Browser = userAgent.Browser;
})(odd);

