const SwigExtension = require('../../index').Swig.Extension;

/**
 * Provides the asset(path) function to swig templates
 */
class DefaultExtension extends SwigExtension
{
    constructor (container)
    {
        super();
        this._container = container;
    }

    getFunctions ()
    {
        return {
            'constant': (service, variable) => {
                let c = this._container.get(service);

                if(typeof c[variable] === 'function' || typeof c[variable] === 'object') {
                    return undefined;
                }

                return c[variable];
            }
        };
    }

}

module.exports = DefaultExtension;