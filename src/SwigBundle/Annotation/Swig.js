const parameters = require('get-parameter-names');

const NotFoundHttpException = require('../../Wardrobe/Exception/NotFoundHttpException');

class Swig
{
    constructor (kernel) {
        this._kernel = kernel;
    }

    compile (data)
    {
        if (typeof data.value !== 'undefined') {
            data.template = data.value;
            delete data['value'];
        }

        let _swig    = this._kernel.getContainer().get('swig');
        let _class   = this._kernel.getContainer().get(data._metadata.service);

        const template = this._resolve(data);

        let methodBody = _class[data._metadata.method];
        let params     = parameters(methodBody);


        eval(`_class[data._metadata.method] = async (${params.join(', ')}) => {
            
            if (typeof template === 'undefined') {
                throw new NotFoundHttpException('Unable to find "' + data.template + '" for rendering');
            }

            let parameters = await methodBody.apply(_class, [${params.join(', ')}]);

            if (typeof parameters !== 'object') {
                throw new Error('Invalid type returned from ' + _class.constructor.name);
            }

            return _swig.render(template, parameters);
        };`);

        Object.defineProperty(_class[data._metadata.method], 'name', {
            writable: false,
            value: data._metadata.method
        });
    }

    _resolve (data)
    {
        let _bundle = this._kernel.findBundleByService(data._metadata.service);
        let _class  = this._kernel.getContainer().get(data._metadata.service);

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