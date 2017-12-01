const ParameterBag = require('./ParameterBag');

class ServerBag extends ParameterBag
{

    getHeaders ()
    {
        let headers = {};
        let contentHeaders = {
            CONTENT_LENGTH: true,
            CONTENT_MD5: true,
            CONTENT_TYPE: true
        };

        for(let key of Object.keys(this._parameters)) {
            let value = this._parameters[key];

            if(key.indexOf('http_') === 0) {
                headers[key.substr(5)] = value;
            } else if (typeof contentHeaders[key] !== 'undefined') {
                headers[key] = value;
            }
        }

        // TODO: AUTHORIZATION headers (basic auth)
        // if(this.has('JS_AUTH_USER')) {
        //     headers['JS_AUTH_USER'] = this.get('JS_AUTH_USER');
        //     headers['JS_AUTH_PW'] = this.get('JS_AUTH_PW', '');
        // } else {
        //
        // }



        return headers;
    }
}

module.exports = ServerBag;