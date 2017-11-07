const iterator = require('./iterator'),
      doctrine = require('doctrine');

const InvalidArgumentException = require('../Exceptions/InvalidArgumentException');

class AnnotationParser
{

    constructor (kernel)
    {
        this._kernel    = kernel;
        this._compilers = {};
    }

    parse (instance)
    {
        let source     = instance.toString();
        let classMatch = source.match(/class\s+(.*?)[\s{]+/);
        if (!classMatch) {
            return;
        }
        let className = classMatch[1];

        let match, regexp = /\/\*{2}([\s\S]+?)\*\/[\s\S]+?([A-Za-z0-9\_]+)/g;
        while (match = regexp.exec(source)) {
            if (typeof match[1] !== 'string' || typeof match[2] !== 'string') {
                continue;
            }

            let docs = doctrine.parse(match[1], {sloppy: true, unwrap: true, tags: Object.keys(this._compilers)});
            let tags = docs.tags;

            tags.forEach(tag => {

                let data       = this._dataBuilder(tag.description);
                data._kernel   = this._kernel;
                data._metadata = {
                    class:  instance.name,
                    method: match[2]
                };

                let resolvedClass = this.resolve(tag.title);
                new resolvedClass(data);

            });
        }
    }

    _dataBuilder (description)
    {
        let chunks = description.substr(1, description.length - 2).split(',');
        let data   = {};

        for (let chunk of chunks) {
            chunk = chunk.trim();

            // grab the value
            let match = chunk.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
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

    resolve (name)
    {
        if (typeof this._compilers[name] === 'undefined') {
            return false;
        }

        return this._compilers[name];
    }

    register (name, cl)
    {
        if (typeof cl !== 'function') {
            throw new InvalidArgumentException(`Invalid handler provided for ${name}`);
        }

        this._compilers[name] = cl;
    }

}

module.exports = AnnotationParser;