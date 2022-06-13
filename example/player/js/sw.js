var VERSION = '2.3.24';
var map = {};

self.addEventListener('install', function (e) {
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (e) {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('message', function (e) {
    switch (e.data.operation) {
        case 'recordstart':
            var item = { data: e.data };
            item.port = e.ports[0];
            if (isSupported(e.data.version) === false) {
                item.port.postMessage({
                    event: 'error',
                    name: 'VersionError',
                    message: 'The player is outdated, please upgrade to ' + e.data.version + ' at least.',
                    filename: e.data.filename,
                    version: VERSION,
                });
                break;
            }
            item.port.onmessage = function (evt) {
                item.stream = evt.data.stream;
                item.port.onmessage = null;
                item.port.postMessage({
                    event: 'recordstart',
                    filename: e.data.filename,
                    version: VERSION,
                });
            };
            map[self.registration.scope + e.data.filename] = item;
            break;

        case 'recordend':
            if (isSupported(e.data.version) === false) {
                break;
            }
            var item = map[self.registration.scope + e.data.filename];
            item.port.onmessage = null;
            delete map[self.registration.scope + e.data.filename];
            break;

        default:
            var port = e.ports[0];
            if (port) {
                item.port.postMessage({
                    event: 'error',
                    name: 'NotSupportedError',
                    message: 'The operation is not supported.',
                    operation: e.data.operation,
                    version: VERSION,
                });
            }
            break;
    }
});

self.addEventListener('fetch', function (e) {
    var item = map[e.request.url];
    if (!item || !item.stream) {
        return;
    }
    var headers = new Headers({
        'Content-Type': 'application/octet-stream; charset=utf-8',
        'Content-Disposition': 'attachment; filename*=UTF-8\'\'' + item.data.filename,
        'Content-Security-Policy': "default-src 'none'",
        'X-Content-Security-Policy': "default-src 'none'",
        'X-WebKit-CSP': "default-src 'none'",
        'X-XSS-Protection': '1; mode=block',
    });
    e.respondWith(new Response(item.stream, { headers: headers }));
    item.port.postMessage({
        event: 'loadstart',
        filename: item.data.filename,
        version: VERSION,
    });
});

function isSupported(version) {
    var minimum = '2.3.24';
    var reg = /^(\d+)\.(\d+)\.(\d+)$/;
    var min = minimum.match(reg);
    var ver = version.match(reg);
    var v = '';
    var m = '';
    for (var i = 1; i < ver.length; i++) {
        var n = Math.max(ver[i].length, min[i].length);
        v += padStart(ver[i], n, '0');
        m += padStart(min[i], n, '0');
    }
    return v >= m;
}

function padStart(str, targetLength, padString) {
    str += '';
    while (str.length < targetLength) {
        str = padString + str;
    }
    return str;
}
