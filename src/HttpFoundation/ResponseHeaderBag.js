const HeaderBag = require('./HeaderBag');
const Cookie    = require('./Cookie');
const moment    = require('moment');

class ResponseHeaderBag extends HeaderBag
{
    constructor (headers = {})
    {
        super(headers);

        this.computedCacheControl = {};
        this.headerNames          = {};
        this.cookies              = {};

        if (!this.has('cache-control')) {
            this.set('cache-control', '');
        }

        if (!this.has('date')) {
            this.initDate();
        }
    }

    allPreserveCase ()
    {
        throw new Error(`Not yet implemented`);
    }

    allPreserveCaseWithoutCookies ()
    {
        throw new Error(`Not yet implemented`);
    }

    replace (headers = {})
    {

        throw new Error(`Not yet implemented`);
    }

    all ()
    {
        let headers = super.all();

        for (let key of Object.keys(this.getCookies())) {
            let cookie = this.getCookies()[key];
            if (typeof headers['set-cookie'] === 'undefined') {
                headers['set-cookie'] = [];
            }
            headers['set-cookie'].push(cookie.toString());
        }

        return headers;
    }

    set (key, values, replace = true)
    {
        let uniqueKey = key.replace(/_/g, '-').toLowerCase();

        if (uniqueKey === 'set-cookie') {
            if (replace) {
                this.cookies = {};
            }
            if (typeof values === 'string') {
                values = [values];
            }
            for (let cookie of Object.values(values)) {
                this.setCookie(Cookie.fromString(cookie));
            }
            this.headerNames[uniqueKey] = key;

            return;
        }

        super.set(key, values, replace);

        if (['cache-control', 'etag', 'last-modified', 'expires'].indexOf(uniqueKey) !== -1) {
            let computed                      = this.computeCacheControlValue();
            this.headers['cache-control']     = computed;
            this.headerNames['cache-control'] = 'Cache-Control';
            this.computedCacheControl         = this.parseCacheControl(computed);
        }

    }

    remove (key)
    {
        throw new Error(`Not yet implemented`);
    }

    hasCacheControlDirective (key)
    {
        return typeof this.computedCacheControl[key] !== 'undefined';
    }

    getCacheControlDirective (key)
    {
        return this.computedCacheControl[key];
    }

    /**
     * Set a cookie
     *
     * @param {Cookie} cookie
     */
    setCookie (cookie)
    {
        if (typeof this.cookies[cookie.getDomain()] === 'undefined') {
            this.cookies[cookie.getDomain()] = {};
        }

        if (typeof this.cookies[cookie.getDomain()][cookie.getPath()] === 'undefined') {
            this.cookies[cookie.getDomain()][cookie.getPath()] = {};
        }

        this.cookies[cookie.getDomain()][cookie.getPath()][cookie.getName()] = cookie;
        this.headerNames['set-cookie']                                       = 'Set-Cookie';
    }

    /**
     * Remove a cookie
     *
     * @param name
     * @param path
     * @param domain
     */
    removeCookie (name, path = '/', domain = null)
    {
        if (path === null) {
            path = '/';
        }

        delete this.cookies[domain][path][name];

        if (Object.keys(this.cookies[domain][path]).length === 0) {
            delete this.cookies[domain][path];
        }

        if (Object.keys(this.cookies[domain]).length === 0) {
            delete this.cookies[domain];
        }

        if (Object.keys(this.cookies).length === 0) {
            delete this.headerNames['set-cookie'];
        }
    }

    getCookies (format = 'flat')
    {
        if (['flat', 'array'].indexOf(format) === -1) {
            throw new Error(`Format ${format} invalid (flat, array).`);
        }

        if (format === 'array') {
            return this.cookies;
        }

        let flattenedCookies = [];
        for (let path of Object.values(this.cookies)) {
            for (let cookies of Object.values(path)) {
                for (let cookie of Object.values(cookies)) {
                    flattenedCookies.push(cookie.toString());
                }
            }
        }

        return flattenedCookies;
    }

    clearCookie (name, path = '/', domain = null, secure = false, httpOnly = true)
    {
        this.setCookie(new Cookie(name, null, 1, path, domain, secure, httpOnly));
    }

    makeDisposition (disposition, filename, filenameFallback = '')
    {
        if (['attachment', 'inline'].indexOf(disposition) === -1) {
            throw new Error(`The disposition must be either "attachment" or "inline".`);
        }

        if (filenameFallback === '') {
            filenameFallback = filename;
        }

        throw new Error(`Not yet implemented`);
    }

    computeCacheControlValue ()
    {
        if (Object.keys(this.cacheControl).length === 0 && !this.has('etag') && !this.has('last-modified') && !this.has('Expires')) {
            return 'no-cache, private';
        }

        if (Object.keys(this.cacheControl).length === 0) {
            return 'private, must-revalidate';
        }

        let header = this.getCacheControlHeader();
        if (typeof this.cacheControl['public'] !== 'undefined' || typeof this.cacheControl['private'] !== 'undefined') {
            return header;
        }

        if (typeof this.cacheControl['s-maxage'] === 'undefined') {
            return header + ', private';
        }

        return header;
    }

    initDate ()
    {
        this.set('Date', moment().utc().format('ddd, D MMM YYYY HH:mm:ss') + ' GMT');
    }

}

module.exports = ResponseHeaderBag;