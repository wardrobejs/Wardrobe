class RequestMatcher
{
    /**
     * @param controller
     * @param action
     * @param path
     * @param host
     * @param methods
     * @param ips
     * @param attributes
     * @param schemes
     */
    constructor (controller, action, path = undefined, host = undefined, methods = undefined, ips = [], attributes = [], schemes = undefined)
    {
        this._controller = controller;
        this._action     = action;
        this._path       = path;
        this._host       = host;
        this._method     = methods;
        this._ips        = ips;
        this._scheme     = schemes; // Currently unused because I don't know what it's supposed to be.
    }

    getController ()
    {
        return this._controller;
    }

    getAction ()
    {
        return this._action;
    }

    getPath ()
    {
        return this._path;
    }

    matches (request)
    {
        if (typeof this._method !== 'undefined' && this._method.indexOf(request.getMethod()) === -1) {
            return false;
        }

        // todo: make smarter? -> compile annotation path into regex .. or something
        if (typeof this._path !== 'undefined' && !this.constructor._matchPath(request.getPathInfo(), this._path)) {
            return false;
        }

        if (typeof this._host !== 'undefined' && this._host !== request.getHost()) {
            return false;
        }

        if (this._ips.length > 0 && this._ips.indexOf(request.getClientIp()) === -1) {
            return false;
        }

        return 0 === this._ips.length;
    }

    static _matchPath (request_uri, route)
    {
        // exact match
        if (request_uri === route) {
            return true;
        }

        let url_chunks  = request_uri.split('/');
        let path_chunks = route.split('/');

        while (url_chunks.length) {
            let url_chunk  = url_chunks.shift();
            let path_chunk = path_chunks.shift();

            // Its a variable, unable to check equalness
            if (path_chunk.charAt(0) === '{' && path_chunk.charAt(path_chunk.length - 1) === '}') {
                continue;
            }

            // one of the chunks don't match
            if (url_chunk !== path_chunk) {
                return false;
            }
        }

        return true;
    }

}

module.exports = RequestMatcher;