const NotFoundHttpException = require('./Exception/NotFoundHttpException');

class HttpKernel
{
    constructor (kernel)
    {
        this._kernel = kernel;
        this._routes = [];
        this._static = {};
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

    async _realHandler (request, response)
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
                return await route.handle(request);
            }
        }

        let asset = this._static[request.url];
        if (typeof asset !== 'undefined') {
            response.setHeader('content-type', asset.type);
            return asset.getBuffer();
        }

        throw new NotFoundHttpException(`${request.url} does not match any route`, 404);
    }

    addRoute (route)
    {
        this._routes.push(route);
    }

    addAsset (asset)
    {
        if (typeof this._static[asset.getPublic()] === 'undefined') {
            this._static[asset.getPublic()] = asset;
        }
    }

}

module.exports = HttpKernel;