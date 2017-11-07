const MethodNotImplementedException = require('../Exceptions/MethodNotImplementedException');

class Renderer
{
    render (asset, parameters)
    {
        throw new MethodNotImplementedException(this, 'render(asset, parameters)');
    }

    accepts (asset)
    {
        throw new MethodNotImplementedException(this, 'accepts(asset)');
    }
}

module.exports = Renderer;