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
        this.swigOpts   = {};
        this.locals     = {};

        if (kernel._debug) {
            this.swigOpts.cache = false;
        }

        for (let id of service_ids) {
            let service = container.get(id);

            this._addFilters(service.getFilters(), service);
            this._addFunctions(service.getFunctions(), service);
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

    _addFunctions (data, service)
    {
        if (!data) {
            return;
        }

        Object.keys(data).forEach((name) => {
            if (typeof data[name] === 'function') {
                this.locals[name] = data[name].bind(service);
            }
        });
    }

    render (source, options)
    {
        return swig.compileFile(source, {locals: this.locals})(options);
    }

}

module.exports = Renderer;