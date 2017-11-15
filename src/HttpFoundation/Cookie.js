const moment = require('moment');

class Cookie
{
    static fromString (cookie, decode = false)
    {
        let data = {
            expires:  0,
            path:     '/',
            domain:   null,
            secure:   false,
            httponly: false,
            raw:      !decode,
            samesime: null
        };

        for (let part of cookie.split(';')) {
            let key, value;
            if (part.indexOf('=') === -1) {
                key   = part.trim();
                value = true;
            } else {
                let chunks = part.split('=', 2);
                key        = chunks[0].trim();
                value      = chunks[1].trim();
            }

            if (typeof data['name'] === 'undefined') {
                data['name']  = decode ? decodeURIComponent(key) : key;
                data['value'] = true === value ? null : (decode ? decodeURIComponent(value) : value);
                continue;
            }

            switch (key = key.toLowerCase()) {
                case 'name':
                case 'value':
                    break;
                case 'max-age':
                    data['expires'] = ((new Date).getTime() / 1000) + parseInt(value);
                    break;
                default:
                    data[key] = value;
                    break;
            }
        }

        return new this(data['name'], data['value'], data['expires'], data['path'], data['domain'], data['secure'], data['httponly'], data['raw'], data['samesite']);
    }

    /**
     * @param {String} name
     * @param {String|null} value
     * @param {Number|String|Date} expire
     * @param {String} path
     * @param {String} domain
     * @param {String} secure
     * @param {String} httpOnly
     * @param {String} raw
     * @param {String} sameSite
     */
    constructor (name, value, expire, path, domain, secure, httpOnly, raw, sameSite)
    {
        if (name.match(/[=,; \t\r\n\013\014]/) !== null) {
            throw new Error(`The cookie name "${name}" contains invalid characters.`);
        }

        if (name.length === 0) {
            throw new Error(`The cookie name cannot be empty.`);
        }

        if (expire instanceof Date) {
            expire = expire.getTime() / 1000;
        } else if (typeof expire === 'string') {
            try {
                expire = moment(expire.replace(/GMT/, '+0000'), 'ddd, D-MMM-YYYY HH:mm:ss ZZ').unix();
            } catch (e) {
                throw new Error('The cookie expiration time is not valid.');
            }
        }

        this.name     = name;
        this.value    = value;
        this.domain   = domain;
        this.expire   = 0 < expire ? parseInt(expire) : 0;
        this.path     = path.length === 0 ? '/' : path;
        this.secure   = secure;
        this.httpOnly = httpOnly;
        this.raw      = raw;

        if (null !== sameSite) {
            sameSite = sameSite.toLowerCase();
        }

        if (['lax', 'strict', null].indexOf(sameSite) === -1) {
            throw new Error(`The "sameSite" parameter value is not valid.`);
        }

        this.sameSite = sameSite;
    }

    /**
     * Returns the cookie as a string.
     *
     * @return {string} The cookie
     */
    toString ()
    {
        let str = (this.isRaw() ? this.getName() : encodeURIComponent(this.getName())) + '=';

        if ('' === this.getValue().toString()) {
            str += 'deleted; expires=' + moment((new Date().getTime() - 31536001000)).utc().format('ddd, D-MMM-YYYY HH:mm:ss') + ' GMT; max-age=-31536001';
        } else {
            str += this.isRaw() ? this.getValue : encodeURIComponent(this.getValue());

            if (0 !== this.getExpiresTime()) {
                str += '; expires=' + moment((this.getExpiresTime() * 1000)).utc().format('ddd, D-MMM-YYYY HH:mm:ss') + ' GMT; max-age=' + this.getMaxAge();
            }
        }

        if (this.getPath()) {
            str += '; path=' + this.getPath();
        }

        if (this.getDomain()) {
            str += '; path=' + this.getDomain();
        }

        if (true === this.isSecure()) {
            str += '; secure';
        }

        if (true === this.isHttpOnly()) {
            str += '; httponly';
        }

        if (null !== this.getSameSite()) {
            str += '; samesite=' + this.getSameSite();
        }

        return str;
    }

    /**
     * Gets the name of the cookie.
     *
     * @return {String}
     */
    getName ()
    {
        return this.name;
    }

    /**
     * Gets the value of the cookie.
     *
     * @return {String|null}
     */
    getValue ()
    {
        return this.value;
    }

    /**
     * Gets the domain that the cookie is available to.
     *
     * @return {String|null}
     */
    getDomain ()
    {
        return this.domain;
    }

    /**
     * Gets the time the cookie expires.
     *
     * @return {int}
     */
    getExpiresTime ()
    {
        return this.expire;
    }

    /**
     * Gets the max-age attribute.
     *
     * @return {int}
     */
    getMaxAge ()
    {
        return 0 !== this.expire ? this.expire - (new Date().getTime() / 1000) : 0;
    }

    /**
     * Gets the path on the server in which the cookie will be available on.
     *
     * @return {String}
     */
    getPath ()
    {
        return this.path;
    }

    /**
     * Checks whether the cookie should only be transmitted over a secure HTTPS connection from the client.
     *
     * @return {Boolean}
     */
    isSecure ()
    {
        return this.secure;
    }

    /**
     * Checks whether the cookie will be made accessible only through the HTTP protocol.
     *
     * @return {Boolean}
     */
    isHttpOnly ()
    {
        return this.httpOnly;
    }

    /**
     * Whether this cookie is about to be cleared.
     *
     * @return {Boolean}
     */
    isCleared ()
    {
        return this.expire < (new Date() / 1000);
    }

    /**
     * Checks if the cookie value should be sent with no url encoding.
     *
     * @return {Boolean}
     */
    isRaw ()
    {
        return this.raw;
    }

    /**
     * Gets the SameSite attribute.
     *
     * @return {String|null}
     */
    getSameSite ()
    {
        return this.sameSite;
    }

}

module.exports = Cookie;