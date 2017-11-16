const InvalidArgumentException = require('../Exception/InvalidArgumentException'),
      NotFoundHttpException    = require('../Exception/NotFoundHttpException'),
      LogicException           = require('../Exception/LogicException'),
      RequestMatcher           = require('../../HttpFoundation/RequestMatcher');

class Route
{
    constructor (container, route_handler)
    {
        this._container = container;
        this._router    = route_handler;
        this._services  = {};
    }

    compile (data)
    {
        if (typeof data.value !== 'undefined') {
            data.path = data.value;
            delete data['value'];
        }

        if (data._metadata.method.indexOf('class ') === 0) {
            this._services[data._metadata.service]          = {};
            this._services[data._metadata.service].prefix   = data.path;
            this._services[data._metadata.service].host = data.host;
            return;
        }

        let controller = this._container.get(data._metadata.service);
        let action = controller[data._metadata.method];
        let host;
        if(
            typeof this._services[data._metadata.service] !== 'undefined'
        ) {
            if(typeof this._services[data._metadata.service].prefix !== 'undefined') {
                data.path = this._services[data._metadata.service].prefix + data.path;
            }

            host = this._services[data._metadata.service].host;
        }

        let requestMatch = new RequestMatcher(controller, action, data.path, host);

        this._router.set(requestMatch);
    }

    // _accepts (request_uri, route)
    // {
    //     // exact match
    //     if (request_uri === route) {
    //         return true;
    //     }
    //
    //     let url_chunks  = request_uri.split('/');
    //     let path_chunks = route.split('/');
    //
    //     while (url_chunks.length) {
    //         let url_chunk  = url_chunks.shift();
    //         let path_chunk = path_chunks.shift();
    //
    //         // Its a variable, unable to check equalness
    //         if (this._isVariable(path_chunk)) {
    //             continue;
    //         }
    //
    //         // one of the chunks don't match
    //         if (url_chunk !== path_chunk) {
    //             return false;
    //         }
    //     }
    //
    //     return true;
    // }
    //
    // /**
    //  * @param {Request} request
    //  * @return {Promise.<*>}
    //  */
    // async handle (request)
    // {
    //     let request_uri    = request.server.get('REQUEST_URI');
    //     let request_method = request.server.get('REQUEST_METHOD');
    //
    //     let host = request.server.get('SERVER_NAME');
    //
    //     if (typeof this._routes[host] === 'undefined') {
    //         host = '*';
    //     }
    //
    //     for (let route in this._routes[host]) {
    //         if (!this._routes[host].hasOwnProperty(route)) {
    //             continue;
    //         }
    //         let router = this._routes[host][route];
    //         let method = router.method;
    //
    //         // todo: verify http method ("GET", "POST", etc..)
    //
    //         if (this._accepts(request_uri, route, host)) {
    //             let c    = this._container.get(router.service);
    //             let func = c[router.method];
    //             let args = this._findParameters(func, request, route);
    //             return await func.apply(c, args);
    //         }
    //     }
    //
    //     throw new NotFoundHttpException(`${request_uri} does not match any route`, 404);
    // }
    //
    // _findParameters (method, request, route)
    // {
    //     let url = request.legacy.url;
    //
    //     /** @var {Array} args */
    //     let args = parameters(method);
    //
    //     args[args.indexOf('request')] = request;
    //
    //     let url_chunks  = url.split('/');
    //     let path_chunks = route.split('/');
    //
    //     while (url_chunks.length) {
    //         let url_chunk  = url_chunks.shift().trim();
    //         let path_chunk = path_chunks.shift().trim();
    //
    //         if (this._isVariable(path_chunk)) {
    //             let param    = path_chunk.substr(1, path_chunk.length - 2);
    //             let optional = false;
    //             if (param.substr(-1) === '?') {
    //                 param    = param.substr(0, param.length - 1);
    //                 optional = true;
    //             }
    //             if (args.indexOf(param) !== -1) {
    //                 args[args.indexOf(param)] = url_chunk;
    //             } else if (!optional) {
    //                 throw new InvalidArgumentException(`${method.name} does not contain non-optional parameter ${param}`);
    //             }
    //         }
    //     }
    //
    //     return args;
    // }
    //
    // _isVariable (part)
    // {
    //     return part.charAt(0) === '{' && part.charAt(part.length - 1) === '}';
    // }

}

module.exports = Route;