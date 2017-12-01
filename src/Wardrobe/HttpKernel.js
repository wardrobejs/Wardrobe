const moment         = require('moment');
const SessionHandler = require('./Session/SessionHandler');
const Request        = require('../HttpFoundation/Request');
const Response       = require('../HttpFoundation/Response');

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
        request.session  = this._session_handler.getSession(request, response);
        request.protocol = typeof request.connection.encrypted !== 'undefined' ? 'https' : 'http';
        request.body     = await this.getBody(request);

        if (this.isStatic(request)) {
            return this.getStatic(request, response);
        }

        let actionRequest = new Request(request);

        try {
            let actionResponse = await this._router.route(actionRequest);

            if (!(actionResponse instanceof Response)) {
                actionResponse = new Response(actionResponse);
            }

            actionResponse.prepare(actionRequest);

            let headers = actionResponse.headers.all();

            for (let key of Object.keys(headers)) {
                response.setHeader(key, headers[key]);
            }

            response.statusCode = actionResponse.getStatusCode();
            response.write(actionResponse.getContent());
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

        this._logger.access(`${request.connection.remoteAddress} - - [${moment().format('D/MMM/YYYY:HH:mm:ss ZZ')}] "${request.method} ${request.url} HTTP/${request.httpVersion}" ${response.statusCode} - "${request.protocol}://${request.headers.host}${request.url}" ${request.headers['user-agent']}`);
    }

    isStatic (request)
    {
        let static_file = path.join(this._kernel.getContainer().getParameter('project_dir'), 'web', request.url);

        return request.method === 'GET' && fs.existsSync(static_file) && !fs.lstatSync(static_file).isDirectory();
    }

    getStatic (request, response)
    {
        let static_file = path.join(this._kernel.getContainer().getParameter('project_dir'), 'web', request.url);

        let mimetype   = require('mime-types').lookup(static_file);
        let fileBuffer = fs.readFileSync(static_file);

        response.setHeader('content-type', mimetype);
        response.setHeader('content-length', fileBuffer.length);
        response.write(fileBuffer);
        response.end();
    }

    async getBody (request)
    {
        return await new Promise((resolve) => {
            let body = new Buffer(0);
            request.on('data', (data) => {
                body = Buffer.concat([body, data], body.length + data.length);
            });

            request.on('end', () => {
                resolve(body);
            });
        });
    }
}

module.exports = HttpKernel;