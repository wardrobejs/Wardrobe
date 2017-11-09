const iterator   = require('../Helper/iterator'),
      parameters = require('get-parameter-names');

const InvalidArgumentException = require('../Exception/InvalidArgumentException');

class Route
{
    constructor (data)
    {

        this.path = undefined;

        if (typeof data.value !== 'undefined') {
            data.path = data.value;
            delete data['value'];
        }

        this._metadata = data._metadata;
        this._kernel   = data._kernel;

        delete data['_metadata'];
        delete data['_kernel'];

        for (let [key, value] of iterator(data)) {
            this[key] = value;
        }

        this._kernel.getHttpKernel().addRoute(this);
    }

    accepts (request)
    {
        let url = request.url;

        // exact match
        if (url === this.path) {
            return true;
        }

        let url_chunks  = url.split('/');
        let path_chunks = this.path.split('/');

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

    handle (request)
    {
        let c      = this._kernel.getContainer().get(this._metadata.class);
        let method = c[this._metadata.method].bind(c);

        let args = this._findParameters(method, request);

        return method(...args);
    }

    _findParameters (method, request)
    {
        let url = request.url;

        /** @var {Array} args */
        let args = parameters(method);

        args[args.indexOf('request')] = request;

        let url_chunks  = url.split('/');
        let path_chunks = this.path.split('/');

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