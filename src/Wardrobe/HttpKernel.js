const moment         = require('moment');
const SessionHandler = require('./Session/SessionHandler');

const Request = require('../HttpFoundation/Request');

class HttpKernel
{
    constructor (kernel, router, logger)
    {
        this._kernel = kernel;
        this._router = router;
        this._logger = logger;

        this._session_handler = new SessionHandler();
    }

    async handle (request, response)
    {
        request.session = this._session_handler.getSession(request, response);

        request.protocol = typeof request.connection.encrypted !== 'undefined' ? 'https' : 'http';
        let static_file  = path.join(this._kernel.getContainer().getParameter('project_dir'), 'web', request.url);
        if (request.method === 'GET' && fs.existsSync(static_file) && !fs.lstatSync(static_file).isDirectory()) {
            let mimetype = require('mime-types').lookup(static_file);

            response.setHeader('content-type', mimetype);
            response.write(new Buffer(fs.readFileSync(static_file)));
            response.end();
        } else {
            try { // todo: Response object!
                let handler = await this._realHandler(request, response);
                if (typeof handler !== 'string' && !(handler instanceof Buffer)) {
                    handler = JSON.stringify(handler);
                    response.setHeader('content-type', 'application/json');
                } else {
                    response.setHeader('content-type', 'text/html');
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
        // extract post body
        request.body = await new Promise((resolve) => {
            let body = new Buffer(0);
            request.on('data', (data) => {
                body = Buffer.concat([body, data], body.length + data.length);
            });

            request.on('end', () => {
                resolve(body);
            });
        });

        return await this._router.route(new Request(request));
    }

}

module.exports = HttpKernel;