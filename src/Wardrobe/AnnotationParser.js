const doctrine = require('../doctrine');

class AnnotationParser
{

    constructor (kernel)
    {
        this._kernel = kernel;
    }

    parse (_module)
    {
        let file   = _module.filename;
        let source = fs.readFileSync(file).toString();

        let instance = _module.exports;

        let service   = undefined;
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

                let data       = this.parseDescription(tag.description);
                data._metadata = {
                    service: service,
                    class:   className,
                    method:  match[2].replace('async', '').trim()
                };

                let resolvedClass = this.resolve(tag.title);
                if (typeof resolvedClass.compile === 'undefined') {
                    throw new Error(`${tag.title} does not implement compile(data)`);
                }

                resolvedClass.compile(data, _module);
            });
        }
    }

    parseDescription (description)
    {
        if (!description) {
            return {};
        }

        let chunks = description.substr(1, description.length - 2).split(',');
        let data   = {};

        for (let chunk of chunks) {
            chunk = chunk.trim();

            let value, key = 'value';
            // grab the value
            if (chunk.indexOf('=') === -1) {
                value = this.getValue(chunk);
            } else {
                value = this.getValue(chunk.substr(chunk.indexOf('=') + 1)); // foei!
                key   = chunk.substr(0, chunk.indexOf('='));
            }

            data[key] = value;
        }

        return data;
    }

    getValue (data)
    {
        // number or float
        if (!isNaN(parseInt(data))) {
            if (data.indexOf('.')) {
                return parseFloat(data);
            }
            return parseInt(data);
        }

        // boolean
        if (data === 'true' || data === 'false') {
            return data === 'true';
        }

        // string
        return data.trim('"');
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