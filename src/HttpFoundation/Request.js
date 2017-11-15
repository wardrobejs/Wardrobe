const ParameterBag = require('./ParameterBag');
const FileBag      = require('./ParameterBag'); // todo: make FileBag
const ServerBag    = require('./ParameterBag'); // todo: make ServerBag
const HeaderBag    = require('./ParameterBag'); // todo: make HeaderBag

class Request
{
    constructor (request)
    {
        /** @deprecated */
        this.legacy = request;

        let parameters = request.url.split('?');
        let url        = request.protocol + '://' + request.headers.host + parameters.shift();
        let query      = parameters.shift() || '';

        let body = this._parseRequestBody(request.body, request.headers['content-type']);

        this.initialize(
            this._parseParameters(query),
            body ? body.post : undefined,
            {}, // attributes
            {}, // cookies
            body ? body.files : undefined,
            {},
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
        // this.headers                = new HeaderBag(this.server.getHeaders());
        this.content                = content;
        this.languages              = null;
        this.charsets               = null;
        this.encodings              = null;
        this.acceptableContentTypes = null;
        this.pathInfo               = null;
        this.requestUri             = null;
        this.baseUrl                = null;
        this.basePath               = null;
        this.method                 = null;
        this.format                 = null;
    }

    _parseRequestBody (buffer, content_type)
    {
        if (buffer.length === 0 || typeof content_type === 'undefined') {
            return undefined;
        }

        let str = buffer.toString();

        switch (content_type = content_type.toLowerCase()) {
            case 'application/x-www-form-urlencoded':
                return this._parseParameters(str);
            case 'application/json':
                try {
                    return JSON.parse(str);
                } catch (e) {
                    throw new Error(`Body is not in JSON format`);
                }
            case 'multipart/form-data': // /^multipart\/(?:form-data|related)(?:;|$)/i:
                let seperator = str.split('\r\n', 1)[0];
                let data      = str
                    .split(seperator)
                    .filter(s => s.length)
                    .map(s => s.trim())
                    .map(s => s.split('\r\n\r\n'))
                    .filter(a => a.length === 2);

                let post  = {};
                let files = {};

                while (data.length) {
                    let name, value, filename, contentType;
                    let formData = data.shift();
                    name         = formData[0].match(/name="(.*?)"/i)[1];
                    value        = formData[1];

                    if (formData[0].indexOf('filename') !== -1) {
                        filename    = formData[0].match(/filename="(.*?)"/i)[1];
                        contentType = formData[0].match(/content-type: (.*?)$/mi);
                    }

                    if (typeof filename !== 'undefined') {
                        if (typeof files[name] === 'undefined') {
                            files[name] = [];
                        }
                        files[name].push({
                            filename:       filename,
                            'content-type': contentType
                        });
                    } else {
                        post[name] = value;
                    }
                }

                return {
                    post:  post,
                    files: files
                };

            default:
                return undefined;
        }


    }

    _parseParameters (str, delim = '=')
    {
        str = str.trim('?');

        let parameters = {};

        let key, value;
        for (let part of str.split(delim)) {
            if (part.indexOf('=') === -1) {
                key   = part.trim();
                value = true;
            } else {
                let chunks = part.split('=', 2);
                key        = chunks[0].trim();
                value      = chunks[1].trim('"');
            }
            parameters[key] = value === true ? null : value;
        }

        return parameters;
    }

}

module.exports = Request;