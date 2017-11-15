const RequestMatcher = require('../../HttpFoundation/RequestMatcher');

class Method
{
    constructor (container, route_handler)
    {
        this._container = container;
        this._router    = route_handler;
    }

    compile (data)
    {
        let controller = this._container.get(data._metadata.service);
        let action = controller[data._metadata.method];

        let requestMatch = new RequestMatcher(controller, action, undefined, undefined, data.value);

        this._router.set(requestMatch);
    }

}

module.exports = Method;