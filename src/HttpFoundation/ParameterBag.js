/**
 * Parameter bag is a container for key/value pars.
 */
class ParameterBag
{
    /**
     * @param {Object} parameters
     */
    constructor (parameters = {})
    {
        this._parameters = {};
        for (let key of Object.keys(parameters)) {
            this.set(key.toLowerCase(), parameters[key]);
        }
    }

    /**
     * @return {Object}
     */
    all ()
    {
        return this._parameters;
    }

    /**
     * @return {Array}
     */
    keys ()
    {
        return Object.keys(this._parameters);
    }

    /**
     * @param {Object} parameters
     */
    replace (parameters)
    {
        this._parameters = parameters;
    }

    /**
     * @param {Object} parameters
     */
    add (parameters)
    {
        for (let p of Object.keys(parameters)) {
            this._parameters[p] = parameters[p];
        }
    }

    /**
     * @param {String} key
     * @param {*}      defaultValue
     *
     * @return {String}
     */
    get (key, defaultValue = null)
    {
        return this._parameters[key.toLowerCase()] || defaultValue;
    }

    /**
     * @param {String} key
     * @param {String} value
     */
    set (key, value)
    {
        this._parameters[key.toLowerCase()] = value;
    }

    /**
     * @param {String} key
     * @return {boolean}
     */
    has (key)
    {
        return typeof this._parameters[key.toLowerCase()] !== 'undefined';
    }

    /**
     * @param {String} key
     */
    remove (key)
    {
        delete this._parameters[key.toLowerCase()];
    }

    /**
     * @param {String} key
     * @param {String|null} defaultValue
     * @return {String}
     */
    getAlpha (key, defaultValue = null)
    {
        return this.get(key, defaultValue).replace(/[^[a-zA-Z]]/g, '');
    }

    /**
     * @param {String} key
     * @param {String|null} defaultValue
     * @return {String}
     */
    getAlnum (key, defaultValue = null)
    {
        return this.get(key, defaultValue).replace(/[^[a-zA-Z0-9]]/g, '');
    }

    /**
     * @param {String} key
     * @param {String} defaultValue
     * @return {String}
     */
    getDigits (key, defaultValue = null)
    {
        return this.get(key, defaultValue).replace(/[^[0-9]/g, '');
    }

    /**
     * @param key
     * @param {Number} defaultValue
     * @return {Number}
     */
    getInt (key, defaultValue = 0)
    {
        return parseInt(this.get(key, defaultValue));
    }

    /**
     *
     * @param key
     * @param defaultValue
     * @return {Boolean}
     */
    getBoolean (key, defaultValue = false)
    {
        if (this.has(key)) {
            return this.get(key) !== 'false' && this.get(key) !== false;
        }

        return defaultValue;
    }

    /**
     * @param func function(key, value)
     * @return {Object}
     */
    filter (func)
    {
        let output = {};
        for (let key of Object.keys(this._parameters)) {
            if (true === func(key, this._parameters[key.toLowerCase()])) {
                output[key.toLowerCase()] = this._parameters[key.toLowerCase()];
            }
        }

        return output;
    }

    /**
     * @return {Object}
     */
    getIterator ()
    {
        let o = {...this._parameters};

        o[Symbol.iterator] = function () {

            let properties = Object.keys(this);

            let count = -1;
            let next  = () => {
                count++;

                if (count >= properties.length) {
                    return {done: true};
                }

                return {
                    done:  false,
                    value: [properties[count], this[properties[count]]]
                };
            };

            // return the next method used to iterate
            return {next};
        };

        return o;
    }

    count ()
    {
        return Object.keys(this._parameters).length;
    }
}

module.exports = ParameterBag;