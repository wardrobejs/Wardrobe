const RequestMatcher = require('../../HttpFoundation/RequestMatcher');

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
            this._services[data._metadata.service]        = {};
            this._services[data._metadata.service].prefix = data.path;
            this._services[data._metadata.service].host   = data.host;
            return;
        }

        let controller = this._container.get(data._metadata.service);
        let action     = controller[data._metadata.method];
        let host;
        if (typeof this._services[data._metadata.service] !== 'undefined') {
            if (typeof this._services[data._metadata.service].prefix !== 'undefined') {
                data.path = this._services[data._metadata.service].prefix + data.path;
            }

            host = this._services[data._metadata.service].host;
        }

        let requestMatch = new RequestMatcher(controller, action, data.path, host);

        this._router.set(requestMatch);
    }

}

module.exports = Route;