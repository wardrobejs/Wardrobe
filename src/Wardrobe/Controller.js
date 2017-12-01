const extract = require('./Helper/extract');

class Controller
{
    setRenderer (swig)
    {
        this._swig = swig;
    }

    setContainer (container)
    {
        this._container = container;
    }

    getContainer ()
    {
        return this._container;
    }

    render (template, parameters)
    {
        let file = this._resolve(template);

        if (!file) {
            throw new HttpError(`Unable to find ${template} for rendering`, 404);
        }

        if (!this._swig) {
            return fs.readFileSync(file);
        }

        return this._swig.render(file, parameters);
    }

    _resolve (template)
    {
        let kenel = this.getContainer().get('kernel');

        let name;
        let matches = template.match(/@(.+):\/\/(.*)/);
        if (matches) {
            name     = kenel.getBundle(matches[1]).path;
            template = matches[2];
        } else {
            let bundles = Object.values(require.cache).filter(m => m.exports.toString() === this.constructor.toString());
            let bundle  = extract(bundles.map(b => b.filename.split(path.sep).reverse().filter(p => p.indexOf('Bundle') !== -1)));
            name        = kenel.getBundle(bundle).path;
        }

        template = path.join(name, 'Resources', 'views', template);

        return template;
    }

}

module.exports = Controller;