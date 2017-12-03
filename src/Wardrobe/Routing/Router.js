const parameters = require('get-parameter-names');

class Router
{
    constructor ()
    {
        this._request_matchers = [];
    }

    set (request_matcher)
    {
        let existing = this.findByAction(request_matcher.getAction());
        if (typeof existing === 'undefined') {
            this._request_matchers.push(request_matcher);
            return;
        }

        // update properties
        Object.keys(request_matcher).forEach(key => {
            if (typeof request_matcher[key] !== 'undefined') {
                existing[key] = request_matcher[key];
            }
        });
    }

    findByAction (action)
    {
        for (let request_matcher of this._request_matchers) {
            if (request_matcher.getAction().toString() === action.toString()) {
                return request_matcher;
            }
        }

        return undefined;
    }

    /**
     * @param {Request} request
     */
    async route (request)
    {
        let request_uri = request.server.get('REQUEST_URI');
        /** @var {RequestMatcher} request_matcher */
        for (let request_matcher of this._request_matchers) {
            if (request_matcher.matches(request)) {

                let args = this._compileParameters(
                    request_uri,
                    parameters(request_matcher.getAction()),
                    request_matcher.getPath()
                );

                args[args.indexOf('request')] = request;

                return await request_matcher.getAction().apply(
                    request_matcher.getController(),
                    args
                );
            }
        }

        throw new HttpError(`${request_uri} does not match any route`, 404);
    }

    _compileParameters (request_uri, args, route)
    {
        let url_chunks  = request_uri.split('/');
        let path_chunks = route.split('/');

        while (url_chunks.length) {
            let url_chunk  = url_chunks.shift().trim();
            let path_chunk = path_chunks.shift().trim();

            if (path_chunk.charAt(0) === '{' && path_chunk.charAt(path_chunk.length - 1) === '}') {
                let param = path_chunk.substr(1, path_chunk.length - 2);
                if (args.indexOf(param) !== -1) {
                    args[args.indexOf(param)] = url_chunk;
                }
            }
        }

        return args;
    }

}

module.exports = Router;