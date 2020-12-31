const Response = require('./Response');

class RedirectResponse extends Response
{
    constructor (url, code = 302, headers = {})
    {
        super(null, code, headers);

        this.headers.set('Location', url, true);
        this.setStatusCode(code);
    }
}

module.exports = RedirectResponse;