const dot  = require('dot-object'),
      swig = require('swig');

const NotFoundHttpException = require('./Exceptions/NotFoundHttpException');

class Controller
{
    constructor (swig)
    {
        this._swig = swig;
        this._container = null;
    }

    setContainer (container)
    {
        this._container     = container;
        this._asset_manager = this._container.get('asset_manager');
        this._http_kernel   = this._container.get('http_kernel');
    }

    getContainer ()
    {
        return this._container;
    }

    render (template, parameters)
    {
        const asset = this._asset_manager.resolve(template);

        if (!asset) {
            throw new NotFoundHttpException(`Unable to find ${template} for rendering`);
        }

        let render = this._swig.compileFile(asset.file);

        return render(parameters);
    }

}

module.exports = Controller;