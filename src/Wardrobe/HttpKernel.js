const NotFoundHttpException = require('./Exceptions/NotFoundHttpException');

class HttpKernel
{
    constructor (kernel)
    {
        this._kernel    = kernel;
        this._routes    = [];
    }

    handle (request, response)
    {
        try {

            let handler = this._realHandler(request);
            if (typeof handler !== 'string' && !(handler instanceof Buffer)) {
                handler = JSON.stringify(handler);
            }

            response.write(handler);
            response.end();
        } catch (e) {
            response.statusCode = e.code || 500;

            if (!this._kernel._debug) {
                response.write(e.message);
            } else {
                response.write(e.stack);
            }
            response.end();
        }
    }

    _realHandler (request)
    {
        let parameters     = request.url.split('?');
        request.url        = parameters.shift();
        request.parameters = {};

        let chunks = parameters.join('?').split('&');
        while (chunks.length) {
            let parameter = chunks.shift();
            let KvP       = parameter.split('=');
            let key       = KvP.shift();

            request.parameters[key] = KvP.join('=');

        }

        for (let route of this._routes) {
            if (route.accepts(request)) {
                return route.handle(request);
            }
        }

        throw new NotFoundHttpException(`${request.url} does not match any route`, 404);
    }

    addRoute (route)
    {
        this._routes.push(route);
    }

}

module.exports = HttpKernel;