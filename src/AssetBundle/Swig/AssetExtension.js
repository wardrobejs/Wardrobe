const SwigExtension = require('../../index').Swig.SwigExtension;

/**
 * Provides the asset(path) function to swig templates
 */
class AssetExtension extends SwigExtension
{
    constructor (asset_manager)
    {
        super();
        this._asset_manager = asset_manager;
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

module.exports = AssetExtension;