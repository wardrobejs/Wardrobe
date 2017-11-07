const AnnotationParser = require('./Helpers/AnnotationParser');

class ControllerResolver
{
    constructor ()
    {
        this._annotation_parser = new AnnotationParser();

        this._compiler = {};
        this._controllers = {};
    }

    addController (source)
    {

        this._controllers[className] = {
            methods: this._annotation_parser.parse(source)
        };

    }

    addAnnotationCompiler(name, cl)
    {
        // eg, Route
        // cl = class to parse Route
    }

}

module.exports = ControllerResolver;