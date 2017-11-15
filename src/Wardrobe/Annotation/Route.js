const parameters = require('get-parameter-names');

const InvalidArgumentException = require('../Exception/InvalidArgumentException'),
      NotFoundHttpException    = require('../Exception/NotFoundHttpException'),
      LogicException           = require('../Exception/LogicException');

class Route
{
    constructor (container)
    {
        this._container = container;
        this._routes    = {};
        this._services  = {};
    }

    compile (data)
    {
        this.path = undefined;

        if (typeof data.value !== 'undefined') {
            data.path = data.value;
            delete data['value'];
        }

        if (data._metadata.method.indexOf('class ') === 0) {
            this._services[data._metadata.service]          = {};
            this._services[data._metadata.service].prefix   = data.path;
            this._services[data._metadata.service].hostname = data.hostname;
            return;
        }

        let service = this._services[data._metadata.service];

        service = service || {};
        if (typeof this._routes[service.hostname || '*'] === 'undefined') {
            this._routes[service.hostname || '*'] = {};
        }

        if (data.path.charAt(0) !== '/') {
            data.path = '/' + data.path;
        }

        if (typeof service.prefix !== 'undefined') {
            if (service.prefix.charAt(0) !== '/') {
                service.prefix = '/' + service.prefix;
            }
            data.path = service.prefix + data.path;
        }

        if (typeof this._routes[service.hostname || '*'][data.path] !== 'undefined') {
            throw new LogicException(`Trying to register two routes with the same url ${service.hostname + ' ' || ' '}"${data.path}"`);
        }

        this._routes[service.hostname || '*'][data.path]         = {};
        this._routes[service.hostname || '*'][data.path].service = data._metadata.service;
        this._routes[service.hostname || '*'][data.path].class   = data._metadata.class;
        this._routes[service.hostname || '*'][data.path].method  = data._metadata.method;
    }

    _accepts (request, route)
    {
        let url = request.url;

        // exact match
        if (url === route) {
            return true;
        }

        let url_chunks  = url.split('/');
        let path_chunks = route.split('/');

        while (url_chunks.length) {
            let url_chunk  = url_chunks.shift();
            let path_chunk = path_chunks.shift();

            // Its a variable, unable to check equalness
            if (this._isVariable(path_chunk)) {
                continue;
            }

            // one of the chunks don't match
            if (url_chunk !== path_chunk) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param {Request} request
     * @return {Promise.<*>}
     */
    async handle (request)
    {
        request = request.legacy;

        let host = request.headers.host.substr(0, request.headers.host.indexOf(':'));

        if (typeof this._routes[host] === 'undefined') {
            host = '*';
        }

        for (let route in this._routes[host]) {
            if (!this._routes[host].hasOwnProperty(route)) {
                continue;
            }
            let router = this._routes[host][route];
            let method = router.method;

            // todo: verify http method ("GET", "POST", etc..)

            if (this._accepts(request, route, host)) {
                let c    = this._container.get(router.service);
                let func = c[router.method];
                let args = this._findParameters(func, request, route);
                return await func.apply(c, args);
            }
        }

        throw new NotFoundHttpException(`${request.url} does not match any route`, 404);
    }

    _findParameters (method, request, route)
    {
        let url = request.url;

        /** @var {Array} args */
        let args = parameters(method);

        args[args.indexOf('request')] = request;

        let url_chunks  = url.split('/');
        let path_chunks = route.split('/');

        while (url_chunks.length) {
            let url_chunk  = url_chunks.shift().trim();
            let path_chunk = path_chunks.shift().trim();

            if (this._isVariable(path_chunk)) {
                let param    = path_chunk.substr(1, path_chunk.length - 2);
                let optional = false;
                if (param.substr(-1) === '?') {
                    param    = param.substr(0, param.length - 1);
                    optional = true;
                }
                if (args.indexOf(param) !== -1) {
                    args[args.indexOf(param)] = url_chunk;
                } else if (!optional) {
                    throw new InvalidArgumentException(`${method.name} does not contain non-optional parameter ${param}`);
                }
            }
        }

        return args;
    }

    _isVariable (part)
    {
        return part.charAt(0) === '{' && part.charAt(part.length - 1) === '}';
    }

}

module.exports = Route;