const extract = require('../../Wardrobe/Helper/extract');

const NotFoundHttpException = require('../../Wardrobe/Exception/NotFoundHttpException');

class Swig
{
    constructor (data)
    {
        if (typeof data.value !== 'undefined') {
            data.template = data.value;
            delete data['value'];
        }

        let c = data._kernel.getContainer().get(data._metadata.class);
        let s = data._kernel.getContainer().get('swig');
        let a = data._kernel.getContainer().get('asset_manager');

        let bundles = Object.values(require.cache).filter(m => m.exports.toString() === c.constructor.toString())
            .map(b => b.filename.split(path.sep).reverse().filter(p => p.indexOf('Bundle') !== -1));

        if (!data.template && bundles.length) {
            let bundle = extract(bundles);
            let controller = c.constructor.name.replace('Controller', '').toLowerCase();
            let action     = data._metadata.method.replace('Action', '').toLowerCase();
            data.template = `@${bundle}://Resources/views/${controller}/${action}.html.twig`;
        }

        const asset = a.resolve(data.template);

        let methodBody = c[data._metadata.method];

        c[data._metadata.method] = () => {

            if(typeof asset === 'undefined') {
                throw new NotFoundHttpException(`Unable to find '${data.template}' for rendering`)
            }

            let bodyValue = methodBody.bind(c)();

            if(typeof bodyValue !== 'object') {
                throw new Error(`Invalid type returned from ${c.constructor.name}.${data._metadata.method}(). Exptected an 'object', but received '${typeof bodyValue}' instead`);
            }

            return s.render(asset.file, bodyValue);
        }
    }
}

module.exports = Swig;