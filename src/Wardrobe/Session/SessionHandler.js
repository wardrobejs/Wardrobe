const Session = require('./Session');

class SessionHandler
{
    constructor (name = undefined, maxAge = undefined, checkInterval = undefined)
    {
        this._cookie_name    = name || 'JSSESSID';
        this._max_age        = maxAge || 1440;
        this._sessions       = {};

        setInterval(() => {
            this._gc();
        }, checkInterval || 1000 * 60);
    }

    forEachSession (cb)
    {
        for (let session of Object.keys(this._sessions)) {
            cb(this._sessions[session]);
        }
    }

    deleteSession (id)
    {
        if (typeof this._sessions[id] !== 'undefined') {
            delete this._sessions[id];
            return true;
        }

        return false;
    }

    getSession (request, response)
    {
        let sessCookie = this.getCookies(request)[this._cookie_name];
        if (typeof this._sessions[sessCookie] !== 'undefined') {
            return this._sessions[sessCookie].refresh();
        }

        let session = new Session();
        response.setHeader('Set-Cookie', [`${this._cookie_name}=${session}`]);

        this._sessions[`${session}`] = session;
        return session;
    }

    getCookies (request)
    {
        if (typeof request.headers['cookie'] === 'undefined') {
            return {};
        }

        let ret = {};
        request.headers['cookie'].split(';').map(cookie => {
            let data     = cookie.split('=');
            ret[data[0]] = data[1];
        });
        return ret;
    }

    _gc() {
        let now = new Date().getTime();
        this.forEachSession((session) => {
            if (now - session.getTime() > this._max_age * 1000) {
                delete this._sessions[`${session}`];
            }
        });
    }
}

module.exports = SessionHandler;