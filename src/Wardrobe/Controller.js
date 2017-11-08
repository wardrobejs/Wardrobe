const dot  = require('dot-object'),
      swig = require('swig');

const NotFoundHttpException = require('./Exceptions/NotFoundHttpException');

class Controller
{
    setRenderer ()
    {
        this._swig = swig;
    }

    setContainer (container)
    {
        this._container     = container;
        this._asset_manager = this._container.get('asset_manager');
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