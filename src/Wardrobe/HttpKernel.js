class HttpKernel
{
    constructor (kernel, route)
    {
        this._kernel = kernel;
        this._route  = route;
    }

    async handle (request, response)
    {
        let static_file = path.join(this._kernel.getContainer().getParameter('project_dir'), 'web', request.url);
        if (fs.existsSync(static_file) && !fs.lstatSync(static_file).isDirectory()) {
            let mimetype = require('mime-types').lookup(static_file);

            response.setHeader('content-type', mimetype);
            response.write(new Buffer(fs.readFileSync(static_file)));
            response.end();

            return;
        }

        try {

            let handler = await this._realHandler(request, response);
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

    async _realHandler (request)
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

        return await this._route.handle(request);
    }

}

module.exports = HttpKernel;