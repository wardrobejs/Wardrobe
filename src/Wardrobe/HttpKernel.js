const moment = require('moment');

class HttpKernel
{
    constructor (kernel, route, logger)
    {
        this._kernel = kernel;
        this._route  = route;
        this._logger = logger;
    }

    async handle (request, response)
    {
        request.protocol = typeof request.connection.encrypted !== 'undefined' ? 'https' : 'http';
        let static_file = path.join(this._kernel.getContainer().getParameter('project_dir'), 'web', request.url);
        if (fs.existsSync(static_file) && !fs.lstatSync(static_file).isDirectory()) {
            let mimetype = require('mime-types').lookup(static_file);

            response.setHeader('content-type', mimetype);
            response.write(new Buffer(fs.readFileSync(static_file)));
            response.end();
        } else {

            try {

                let handler = await this._realHandler(request, response);
                if (typeof handler !== 'string' && !(handler instanceof Buffer)) {
                    handler = JSON.stringify(handler);
                }

                response.write(handler);
                response.end();
            } catch (e) {
                response.statusCode = e.code || 500;
                this._logger.error(e.stack);
                if (!this._kernel._debug) {
                    response.write(e.message); // todo: customizable error screen
                } else {
                    response.write(e.stack);
                }
                response.end();
            }
        }

        this._logger.access(`${request.connection.remoteAddress} - - [${moment().format('D/MMM/YYYY:HH:mm:ss ZZ')}] "${request.method} ${request.url} HTTP/${request.httpVersion}" ${response.statusCode} - "${request.protocol}://${request.headers.host}${request.url}" ${request.headers['user-agent']}`);
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