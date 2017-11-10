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
        this.swigOpts.locals = {};

        if (kernel._debug) {
            this.swigOpts.cache = false;
        }

        swig.setDefaults(this.swigOpts);

        for (let id of service_ids) {
            let service = container.get(id);

            this._addFilters(service.getFilters(), service);
            this._addFunctions(service.getFunctions(), service);
            this._addTags(service.getTokenParsers());
        }
    }

    _addTags (data)
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
                this.swigOpts.locals[name] = data[name].bind(service);
            }
        });
    }

    render (source, options)
    {
        if(!fs.existsSync(source)) {
            throw new Error(`File not found ${source}`)
        }
        return swig.compileFile(source, this.swigOpts)(options);
    }

}

module.exports = Renderer;