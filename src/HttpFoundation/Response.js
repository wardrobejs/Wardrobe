const ResponseHeaderBag = require('./ResponseHeaderBag');

class Response
{
    static get statusTexts ()
    {
        return {
            100: 'Continue',
            101: 'Switching Protocols',
            102: 'Processing',            // RFC2518
            103: 'Early Hints',
            200: 'OK',
            201: 'Created',
            202: 'Accepted',
            203: 'Non-Authoritative Information',
            204: 'No Content',
            205: 'Reset Content',
            206: 'Partial Content',
            207: 'Multi-Status',          // RFC4918
            208: 'Already Reported',      // RFC5842
            226: 'IM Used',               // RFC3229
            300: 'Multiple Choices',
            301: 'Moved Permanently',
            302: 'Found',
            303: 'See Other',
            304: 'Not Modified',
            305: 'Use Proxy',
            307: 'Temporary Redirect',
            308: 'Permanent Redirect',    // RFC7238
            400: 'Bad Request',
            401: 'Unauthorized',
            402: 'Payment Required',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            406: 'Not Acceptable',
            407: 'Proxy Authentication Required',
            408: 'Request Timeout',
            409: 'Conflict',
            410: 'Gone',
            411: 'Length Required',
            412: 'Precondition Failed',
            413: 'Payload Too Large',
            414: 'URI Too Long',
            415: 'Unsupported Media Type',
            416: 'Range Not Satisfiable',
            417: 'Expectation Failed',
            418: 'I\'m a teapot',                                               // RFC2324
            421: 'Misdirected Request',                                         // RFC7540
            422: 'Unprocessable Entity',                                        // RFC4918
            423: 'Locked',                                                      // RFC4918
            424: 'Failed Dependency',                                           // RFC4918
            425: 'Reserved for WebDAV advanced collections expired proposal',   // RFC2817
            426: 'Upgrade Required',                                            // RFC2817
            428: 'Precondition Required',                                       // RFC6585
            429: 'Too Many Requests',                                           // RFC6585
            431: 'Request Header Fields Too Large',                             // RFC6585
            451: 'Unavailable For Legal Reasons',                               // RFC7725
            500: 'Internal Server Error',
            501: 'Not Implemented',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout',
            505: 'HTTP Version Not Supported',
            506: 'Variant Also Negotiates',                                     // RFC2295
            507: 'Insufficient Storage',                                        // RFC4918
            508: 'Loop Detected',                                               // RFC5842
            510: 'Not Extended',                                                // RFC2774
            511: 'Network Authentication Required',                             // RFC6585
        };
    }

    constructor (content, code = 200, headers = {})
    {
        this.headers = new ResponseHeaderBag(headers);
        this.setContent(content);
        this.statusCode      = code;
        this.charSet         = null;
        this.statusText      = '';
        this.protocolVersion = '1.1';
    }

    prepare (request)
    {
        let headers = this.headers;

        if (this.isInformational() || this.isEmpty()) {
            this.setContent(null);
            headers.remove('content-type');
            headers.remove('content-length');
        } else {
            if (!headers.has('content-type')) {
                let format = request.getRequestFormat();
                if (format && request.getMimeType(format)) {
                    headers.set('Content-Type', request.getMimeType(format));
                }
            }

            let charset = this.charSet || 'UTF-8';
            if (!headers.has('content-type')) {
                headers.set('content-type', `text/html; charset=${charset}`);
            } else if (headers.get('content-type').indexOf('text/') === 0 && headers.get('content-type').toLowerCase().indexOf('charset') === -1) {
                headers.set('content-type', headers.get('content-type') + `; charset=${charset}`);
            }

            if (headers.has('transfer-encoding')) {
                headers.remove('content-length');
            }

            if (request.isMethod('HEAD')) {
                let length = headers.get('content-length');
                this.setContent(null);
                if (length) {
                    headers.set('content-length', length);
                }
            }

        }
    }

    setContent (content)
    {
        if (typeof content === 'string' || content instanceof Buffer) {
            this.content = content;
            this.headers.set('Content-Length', [content.length]);
        }

        if (typeof content === 'object') {
            this.content = JSON.stringify(content);
            this.headers.set('Content-Type', 'application/json');
            this.headers.set('Content-Length', this.content.length);
        }

        return this;
    }

    getContent ()
    {
        return this.content;
    }

    setStatusCode (code, text = null)
    {
        this.statusCode = code;
        if (this.isInvalid()) {
            throw new Error(`The HTTP status code "${code}" is not valid.`);
        }

        if (text === null) {
            this.statusText = Response.statusTexts[code] || 'unknown status';

            return this;
        }

        if (text === false) {
            this.statusText = '';

            return this;
        }

        this.statusText = text;

        return this;
    }

    getStatusCode ()
    {
        return this.statusCode;
    }

    getCharset ()
    {
        return this.charSet;
    }

    isCacheable ()
    {
        if ([200, 203, 300, 301, 302, 404, 410].indexOf(this.statusCode) === -1) {
            return false;
        }

        if (this.headers.hasCacheControlDirective('no-store') || this.headers.getCacheControlDirective('private')) {
            return false;
        }

        return this.isValidateable() || this.isFresh();
    }

    isFresh ()
    {
        return this.getTtl() > 0;
    }

    isValidateable ()
    {
        return this.headers.has('Last-Modified') || this.headers.has('ETag');
    }

    isInvalid ()
    {
        return this.statusCode < 100 || this.statusCode >= 600;
    }

    getTtl ()
    {
        throw new Error(`Not yet implemented`);
    }

    setProtocolVersion (version)
    {
        this.protocolVersion = version;
    }

    isInformational ()
    {
        return this.statusCode >= 100 && this.statusCode < 200;
    }

    isEmpty ()
    {
        return [204, 304].indexOf(this.statusCode) !== -1;
    }
}

module.exports = Response;