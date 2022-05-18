(function (odd) {
    var utils = odd.utils,

        IO = {},
        Mode = {
            CORS: 'cors',
            NO_CORS: 'no-cors',
            SAME_ORIGIN: 'same-origin',
        },
        Credentials = {
            OMIT: 'omit',
            INCLUDE: 'include',
            SAME_ORIGIN: 'same-origin',
        },
        Cache = {
            DEFAULT: 'default',
            NO_STAORE: 'no-store',
            RELOAD: 'reload',
            NO_CACHE: 'no-cache',
            FORCE_CACHE: 'force-cache',
            ONLY_IF_CACHED: 'only-if-cached',
        },
        Redirect = {
            FOLLOW: 'follow',
            MANUAL: 'manual',
            ERROR: 'error',
        },
        ResponseType = {
            ARRAYBUFFER: 'arraybuffer',
            BLOB: 'blob',
            DOCUMENT: 'document',
            JSON: 'json',
            TEXT: 'text',
        },
        ReadyState = {
            UNINITIALIZED: 0,
            OPEN: 1,
            SENT: 2,
            LOADING: 3,
            DONE: 4,
        },

        _loaders = [];

    IO.register = function (loader, index) {
        try {
            _loaders.splice(index || _loaders.length, 0, loader);
            IO[loader.prototype.kind] = loader;
        } catch (err) {
            throw { name: err.name, message: 'Failed to register loader ' + loader.prototype.kind + ': ' + err.message };
        }
    };

    // It is not recommended to use a stream loader in "vod" mode, due to the buffer limitation.
    // However, you can still omit the "mode" argument, to get a browser supported loader.
    IO.get = function (url, mode) {
        for (var i = 0; i < _loaders.length; i++) {
            var loader = _loaders[i];
            if (loader.prototype.isSupported(url, mode)) {
                return loader;
            }
        }

        return null;
    };

    IO.Mode = Mode;
    IO.Credentials = Credentials;
    IO.Cache = Cache;
    IO.Redirect = Redirect;
    IO.ResponseType = ResponseType;
    IO.ReadyState = ReadyState;

    odd.io = IO.get;
    odd.IO = IO;
})(odd);

