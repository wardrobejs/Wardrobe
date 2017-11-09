const SwigExtension = require('./SwigExtension')

class DefaultExtension extends SwigExtension
{
    constructor (asset_manager)
    {
        super();
        this._asset_manager = asset_manager;
    }

    getFilters ()
    {
        return {

        };
    }

    getTokenParsers ()
    {
        return [

        ];
    }

    getFunctions ()
    {
        return {
            'asset': (url, encoded = false) => {
                if(encoded) {
                    return this._asset_manager.resolve(url).getBase64();
                }

                return this._asset_manager.publish(url, undefined, true);
            }
        }
    }

}

module.exports = DefaultExtension;