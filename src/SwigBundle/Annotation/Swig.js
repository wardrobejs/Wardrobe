const NotFoundHttpException = require('../../Wardrobe/Exception/NotFoundHttpException');

class Swig
{
    constructor (data)
    {
        if (typeof data.value !== 'undefined') {
            data.template = data.value;
            delete data['value'];
        }

        this._kernel = data._kernel;
        this._swig   = this._kernel.getContainer().get('swig');
        let _class   = this._kernel.getContainer().get(data._metadata.class);

        const template = this._resolve(data);

        let methodBody                = _class[data._metadata.method];
        _class[data._metadata.method] = () => {
            if (typeof template === 'undefined') {
                throw new NotFoundHttpException(`Unable to find '${data.template}' for rendering`);
            }

            let parameters = methodBody.bind(_class)();

            if (typeof parameters !== 'object') {
                throw new Error(`Invalid type returned from ${_class.constructor.name}.${data._metadata.method}(). Exptected an 'object', but received '${typeof parameters}' instead`);
            }

            return this._swig.render(template, parameters);
        };
    }

    _resolve (data)
    {
        let _bundle = this._kernel.findBundleByService(data._metadata.class);
        let _class  = this._kernel.getContainer().get(data._metadata.class);

        if (!data.template) {
            let controller = _class.constructor.name.replace('Controller', '').toLowerCase();
            let action     = data._metadata.method.replace('Action', '').toLowerCase();

            data.template = path.join(controller, `${action}.html.twig`);
        }

        let matches = data.template.match(/@(.+):\/\/(.*)/);
        if (matches) {
            let name      = matches[1];
            let dir       = matches[2];
            data.template = path.join(this._kernel.getBundle(name).path, 'Resources', 'views', dir);
        } else {
            data.template = path.join(_bundle.path, 'Resources', 'views', data.template);
        }

        return data.template;
    }
}

module.exports = Swig;