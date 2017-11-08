const swig = require('swig');

/**
 * handles the rendering of swig/twig templates
 */
class Renderer
{
    constructor (container)
    {
        let service_ids = container.findTaggedServiceIds('swig.extension');
        let kernel      = container.get('kernel');
        let swigOpts = {};

        if (kernel._debug) {
            swigOpts.cache = false;
        }

        swig.setDefaults(swigOpts);

        for (let id of service_ids) {
            let service = container.get(id);

            this._addFilters(service.getFilters(), service);
            this._addExtensions(service.getFunctions(), service);
            this._addTags(service.getTokenParsers(), service);
        }
    }

    _addTags (data, service)
    {
        if (!data) {
            return;
        }

        Object.keys(data).forEach((name) => {

            let parser = data[name];
            if (typeof parser === 'function') {
                parser = new parser();
            }

            swig.setTag(parser.getTag(), parser.parse.bind(parser), parser.compile.bind(parser), parser.ends, parser.blockLevel);
        });
    }

    _addFilters (data, service)
    {
        if (!data) {
            return;
        }

        Object.keys(data).forEach((name) => {
            swig.setFilter(name, data[name].bind(service));
        });
    }

    _addExtensions (data, service)
    {
        if (!data) {
            return;
        }

        Object.keys(data).forEach((name) => {
            swig.setExtension(name, data[name].bind(service));
        });
    }

    render (source, options)
    {
        return swig.compileFile(source)(options);
    }

}

module.exports = Renderer;