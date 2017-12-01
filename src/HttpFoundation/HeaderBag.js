class HeaderBag
{
    constructor (headers = {})
    {
        this.headers      = {};
        this.cacheControl = {};

        for (let key of Object.keys(headers)) {
            this.set(key, headers[key]);
        }
    }

    all ()
    {
        return this.headers;
    }

    keys ()
    {
        return Object.keys(this.headers);
    }

    replace (headers = {})
    {
        this.headers = {};
        this.add(headers);
    }

    add (headers = {})
    {
        for (let key of Object.keys(headers)) {
            this.set(key, headers[key]);
        }
    }

    get (key, _default = null, first = true)
    {
        key         = key.replace(/_/g, '-').toLowerCase();
        let headers = this.all();

        if (typeof headers[key] === 'undefined') {
            if (_default === null) {
                return first ? null : {};
            }

            return first ? _default : array(_default);
        }

        if (first) {
            return headers[key].length !== 0 ? headers[key][0] : _default;
        }

        return headers[key];
    }

    set (key, values, replace = true)
    {
        key = key.replace(/_/g, '-').toLowerCase();

        if (typeof values === 'string') {
            if (replace === true || typeof this.headers[key] === 'undefined') {
                this.headers[key] = [values];
            } else {
                this.headers[key].push(values);
            }
        } else {
            values = Object.values(values);

            if (replace === true || typeof this.headers[key] === 'undefined') {
                this.headers[key] = values;
            } else {
                for (let value of values) {
                    this.headers[key].push(value);
                }
            }
        }

        if ('cache-control' === key) {
            this.cacheControl = this.parseCacheControl(this.headers[key].join(', '));
        }

    }

    has (key)
    {
        key = key.toLowerCase().replace(/_/g, '-');
        return typeof this.all()[key] !== 'undefined';
    }

    contains (key, value)
    {
        return this.get(key, null, false).indexOf(value) !== -1;
    }

    remove (key)
    {
        key = key.toLowerCase().replace(/_/g, '-');

        delete this.headers[key];

        if (key === 'cache-control') {
            this.cacheControl = {};
        }
    }

    getDate (key)
    {
        throw new Error(`Not yet implemented`);
    }

    addCacheControlDirective ()
    {
        throw new Error(`Not yet implemented`);
    }

    hasCacheControlDirective ()
    {
        throw new Error(`Not yet implemented`);
    }

    getCacheControlDirective ()
    {
        throw new Error(`Not yet implemented`);
    }

    removeCacheControlDirective (key)
    {
        delete this.cacheControl[key];

        this.set('Cache-Control', this.getCacheControlHeader());
    }

    count ()
    {
        return Object.keys(this.headers).length;
    }

    getCacheControlHeader ()
    {
        let parts = [];
        let keys  = Object.keys(this.cacheControl).sort();
        for (let key in keys) {
            let value = this.cacheControl[key];
            if (value === true) {
                parts.push(key);
            } else {
                if (value.match(/[^a-zA-Z0-9._-]/g) !== null) {
                    value = `"${value}"`;
                }

                parts.push(`${key}=${value}`);
            }
        }

        return parts.join(', ');
    }

    parseCacheControl (header)
    {
        let cacheControl = {};
        header.replace(/([a-zA-Z][a-zA-Z_-]*)\s*(?:=(?:"([^"]*)"|([^ \t",;]*)))?/g, function (a, b, c, d) {
            cacheControl[b] = c || d || true;
        });

        return cacheControl;
    }

}

module.exports = HeaderBag;
