const uuid = require('uuid4');

class Session
{
    constructor ()
    {
        Object.defineProperty(this, '__session_id__', {
            value:      uuid(),
            enumerable: false,
            writable:   false,
        });

        Object.defineProperty(this, '__time__', {
            value:      new Date().getTime().toString(36),
            enumerable: false,
            writable:   true,
        });
    }

    set (name, value)
    {
        if (name === '__session_id__' || name === '__time__') {
            throw new Error(`Illigal name: ${name}`);
        }

        Object.defineProperty(this, name, {
            value:      value,
            enumerable: true,
            writable:   true,
        });

        return this;
    }

    get (name)
    {
        if (name === '__session_id__' || name === '__time__') {
            throw new Error(`Illigal name: ${name}`);
        }

        return this[name];
    }

    refresh ()
    {
        this.__time__ = new Date().getTime().toString(36);
        return this;
    }

    toString ()
    {
        return this.__session_id__;
    }

    getTime ()
    {
        return parseInt(this.__time__, 36);
    }
}

module.exports = Session;