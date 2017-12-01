const MimeTypes = require('mime-types');

const RequestBody  = require('./InputRequest');
const ParameterBag = require('./ParameterBag');
const FileBag      = require('./ParameterBag'); // todo: make FileBag
const ServerBag    = require('./ServerBag');

const Cookie = require('./Cookie');

class Request
{
    constructor (request)
    {
        this.session = request.session;

        let input       = new RequestBody(request);
        let cookieStore = {};

        /** @var {String} request.headers.cookie */
        if (typeof request.headers.cookie !== 'undefined') {
            let cookies = request.headers.cookie.split(';').map(c => Cookie.fromString(c.trim()));

            for (let cookie of cookies) {
                cookieStore[cookie.name] = cookie;
            }
        }

        this.initialize(
            input.getQuery(),
            input.getFields(),
            {},
            cookieStore,
            input.getFiles(),
            this._parseServer(request),
            request.body
        );
    }

    /**
     * Sets the parameters for this request.
     *
     * This method also re-initializes all properties.
     *
     * @param {Object}           query      The GET parameters
     * @param {Object}           request    The POST parameters
     * @param {Object}           attributes The request attributes (parameters parsed from the PATH_INFO, ...)
     * @param {Object}           cookies    The COOKIE parameters
     * @param {Object}           files      The FILES parameters
     * @param {Object}           server     The SERVER parameters
     * @param {Buffer}           content    The raw body data
     */
    initialize (query = {}, request = {}, attributes = {}, cookies = {}, files = {}, server = {}, content = null)
    {
        this.request                = new ParameterBag(request);
        this.query                  = new ParameterBag(query);
        this.attributes             = new ParameterBag(attributes);
        this.cookies                = new ParameterBag(cookies);
        this.files                  = new FileBag(files);
        this.server                 = new ServerBag(server);
        this.headers                = this.server.getHeaders();
        this.content                = content;
        this.languages              = null;
        this.charsets               = null;
        this.encodings              = null;
        this.acceptableContentTypes = null;
        this.pathInfo               = null;
        this.requestUri             = null;
        this.baseUrl                = null;
        this.basePath               = null;
        this.method                 = this.server.get('REQUEST_METHOD');
        this.format                 = null;
    }

    _parseServer (request)
    {
        let server = request.headers.host.split(':');

        let result = {};

        // Object.keys(process.env).forEach(key => {
        //     result[key] = process.env[key];
        // });

        let url = request.url.split('?');

        result['SERVER_NAME']          = server[0];
        result['SERVER_PORT']          = server[1];
        result['SERVER_PROTOCOL']      = request.protocol.toUpperCase() + '/' + request.httpVersion;
        result['HTTP_HOST']            = server[0];
        result['HTTP_USER_AGENT']      = request.headers['user-agent'];
        result['HTTP_ACCEPT']          = request.headers['accept'];
        result['HTTP_ACCEPT_LANGUAGE'] = request.headers['accept-language'];
        result['HTTP_ACCEPT_CHARSET']  = request.headers['accept-charset'];
        result['HTTP_ACCEPT_ENCODING'] = request.headers['accept-encoding'];
        result['REQUEST_TIME']         = Math.floor(new Date().getTime() / 1000);
        result['REQUEST_METHOD']       = request.method.toUpperCase();
        result['REQUEST_URI']          = url.shift() || '/';
        result['QUERY_STRING']         = url.shift() || '';
        result['REMOTE_ADDR']          = request.connection.remoteAddress.replace(/::ffff:/, '');
        result['CONTENT_TYPE']         = request.headers['content-type'];

        for (let header of Object.keys(request.headers)) {
            let name = header.toUpperCase().replace(/-/g, '_');
            if (typeof result[name] === 'undefined' && typeof result[`HTTP_${name}`] === 'undefined') {
                result[name] = request.headers[header];
            }
        }

        if (request.protocol === 'https') {
            result['HTTPS'] = 'on';
        }

        switch (request.method.toUpperCase()) {
            case 'POST':
            case 'PUT':
            case 'DELETE':
                if (typeof result['CONTENT_TYPE'] === 'undefined') {
                    result['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
                }
                break;
        }

        const ordered = {};
        Object.keys(result).sort().forEach(function (key) {
            if (typeof result[key] !== 'undefined') {
                ordered[key.toLowerCase()] = result[key];
            }
        });

        return ordered;
    }

    get (key, defaultValue)
    {
        if (this.request.has(key)) {
            return this.request.get(key);
        }

        if (this.query.has(key)) {
            return this.query.get(key);
        }

        if (this.attributes.has(key)) {
            return this.attributes.get(key);
        }

        if (this.cookies.has(key)) {
            return this.cookies.get(key);
        }

        if (this.files.has(key)) {
            return this.files.get(key);
        }

        if (this.server.has(key)) {
            return this.server.get(key);
        }

        return defaultValue;
    }

    getMethod ()
    {
        return this.server.get('REQUEST_METHOD');
    }

    getPathInfo ()
    {
        return this.server.get('REQUEST_URI');
    }

    getHost ()
    {
        return this.server.get('HTTP_HOST');
    }

    getClientIp ()
    {
        // todo: https://github.com/symfony/http-foundation/blob/master/Request.php#L767
        return this.server.get('REMOTE_ADDR');
    }

    getRequestFormat (_default = 'html')
    {
        if (typeof this.format === 'undefined' || this.format === null) {
            this.format = this.attributes.get('_format');
        }

        return this.format || _default;
    }

    getMimeType (format)
    {
        return MimeTypes.lookup(format);
    }

    isMethod (method)
    {
        return this.method.toLowerCase() === method.toLowerCase();
    }

    getSession ()
    {
        return this.session;
    }

}

module.exports = Request;