const ParameterBag = require('./ParameterBag');
const FileBag      = require('./ParameterBag'); // todo: make FileBag
const ServerBag    = require('./ParameterBag'); // todo: make ServerBag
const HeaderBag    = require('./ParameterBag'); // todo: make HeaderBag

const multipart = require('./MultipartParser');

class Request
{
    constructor (request)
    {
        /** @deprecated */
        this.legacy = request;

        let parameters = request.url.split('?');
        let url        = request.protocol + '://' + request.headers.host + parameters.shift();
        let query      = parameters.shift() || '';

        let body = multipart.Parse(request.body, request.body.toString().split('\r\n')[0].trim('-'));

        let files = {};
        let fields = {};

        for(let item of body) {
            if(typeof item.filename !== 'undefined') {
                if(typeof files[item.name] === 'undefined') {
                    files[item.name] = [];
                }
                files[item.name].push({
                    filename: item.filename,
                    content: item.data,
                    size: item.data.length,
                });
            } else {
                fields[item.name] = item.data;
            }
        }

        this.initialize(
            this._parseParameters(query),
            fields,
            {}, // attributes
            {}, // cookies
            files,
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

        let content_type_data = content_type.split(';');
        content_type          = content_type_data.shift().trim().toLowerCase();
        content_type_data     = content_type_data.join(';');

        switch (content_type) {
            case 'application/x-www-form-urlencoded':
                return this._parseParameters(str);
            case 'application/json':
                try {
                    return JSON.parse(str);
                } catch (e) {
                    throw new Error(`Body is not in JSON format`);
                }
            case 'multipart/form-data': // /^multipart\/(?:form-data|related)(?:;|$)/i:
                return this._parseMultipart(buffer, content_type_data);
            default:
                return undefined;
        }
    }

    _parseParameters (str, delim = '&')
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
            if (value === true) {
                parameters['value'] = key;
            } else {
                parameters[key] = value;
            }
        }

        return parameters;
    }

    /**
     * @param {Buffer} data
     * @param content_type_data
     * @private
     */
    _parseMultipart (data, content_type_data)
    {
        if (!data instanceof Buffer) {
            throw new Error(`data must be a Buffer`);
        }

        let delimiter = '\r\n';
        let extra     = this._parseParameters(content_type_data.trim(), ';');
        let boundary  = extra.boundary || data.toString().split('\r\n')[0].trim('-');

        // A multipart can contain either properties or files
        let body  = {};
        let files = {};

        let rough = data
            .toString()
            .split(boundary)
            .map(l => l.split(delimiter + delimiter, 2).map(s => {
                if (s.substr(-4) === '\r\n--') {
                    return s.substr(0, s.length - 4);
                }

                return s;
            }))
            .filter(a => a.length === 2);

        for (let d of rough) {
            let headers = {};
            d[0].trim().split(delimiter).map(s => {
                let _                       = s.split(':');
                headers[_[0].toLowerCase()] = this._parseParameters(_[1], ';');
                return s;
            });
            let value = new Buffer(d[1]);

            if (typeof headers['content-disposition'].filename === 'undefined') {
                // normal
                body[headers['content-disposition'].name] = d[1];
            } else {
                if(typeof files[headers['content-disposition'].name] === 'undefined') {
                    files[headers['content-disposition'].name] = [];
                }
                files[headers['content-disposition'].name].push({
                    name: headers['content-disposition'].filename,
                    size: value.length,
                    content: value,
                    'content-type': headers['content-type'].value || 'text/plain'
                });
            }
        }

        return {
            post: body,
            files: files
        }
    }


}

module.exports = Request;