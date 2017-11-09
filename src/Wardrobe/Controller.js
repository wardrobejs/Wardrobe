const NotFoundHttpException = require('./Exception/NotFoundHttpException');

class Controller
{
    setRenderer (swig)
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

        return this._swig.render(asset.file, parameters);
    }

}

module.exports = Controller;