const doctrine = require('doctrine'),
      extract  = require('./Helper/extract');

const InvalidArgumentException = require('./Exception/InvalidArgumentException'),
      MethodNotImplementedException = require('./Exception/MethodNotImplementedException');

class AnnotationParser
{

    constructor (kernel)
    {
        this._kernel    = kernel;
        this._compilers = {};
    }

    parse (module)
    {
        let file = module.filename;
        let source = fs.readFileSync(file).toString();

        let instance = module.exports;

        let service   = instance.name;
        let className = instance.name;

        for (let name of Object.keys(this._kernel._container.$.definitions)) {
            let def = this._kernel._container.$.definitions[name];
            if (def.$.class_function === instance) {
                service = name;
            }
        }

        let match, regexp = /\/\*{2}([\s\S]+?)\*\/[\s\S]+?([A-Za-z0-9_ ]+)/g;
        while (match = regexp.exec(source)) {
            if (typeof match[1] !== 'string' || typeof match[2] !== 'string') {
                continue;
            }

            let docs = doctrine.parse(match[1], {sloppy: true, unwrap: true, tags: Object.keys(this.compilers)});
            let tags = docs.tags;

            tags.forEach(tag => {

                let data       = this._dataBuilder(tag.description);
                data._kernel   = this._kernel;
                data._metadata = {
                    service: service,
                    class:   className,
                    method:  match[2].replace('async', '').trim()
                };

                let resolvedClass = this.resolve(tag.title);
                if(typeof resolvedClass.compile === 'undefined') {
                    throw new MethodNotImplementedException(`${tag.title} does not implement compile(data)`);
                }

                resolvedClass.compile(data);

            });
        }
    }

    _dataBuilder (description)
    {
        if (!description) {
            return {};
        }

        let chunks = description.substr(1, description.length - 2).split(',');
        let data   = {};

        for (let chunk of chunks) {
            chunk = chunk.trim();

            // grab the value
            let match = chunk.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
            if (!match) {
                return {};
            }

            match = match[0];

            let value = match.substr(1, match.length - 2);

            let key = chunk.replace(match, '');
            key     = key.substr(0, key.length - 1).trim();
            if (!key.length) {
                key = 'value';
            }
            data[key] = value;
        }

        return data;
    }

    get compilers ()
    {
        let _compilers = {};

        let services = this._kernel.getContainer().findTaggedServiceIds('annotation');
        for (let i of Object.keys(services)) {
            let service                          = this._kernel.getContainer().get(services[i]);
            _compilers[service.constructor.name] = service;
        }

        return _compilers;
    }

    resolve (name)
    {
        for (let i of Object.keys(this.compilers)) {
            if (i === name) {
                return this.compilers[i];
            }
        }

        return undefined;
    }

}

module.exports = AnnotationParser;