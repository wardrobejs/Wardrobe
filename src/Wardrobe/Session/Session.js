const uuid = require('uuid4');
const ParameterBag = require('../../HttpFoundation/ParameterBag');

class Session extends ParameterBag
{
    constructor ()
    {
        super();
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