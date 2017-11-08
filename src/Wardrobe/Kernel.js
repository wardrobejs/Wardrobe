const DI         = require('apex-di'),
      glob       = require('globby'),
      dot        = require('dot-object'),
      parameters = require('./Helpers/parameters'),
      instanceOf = require('./Helpers/instanceof'),
      search     = require('./Helpers/search'),
      http       = require('http'),
      https      = require('https'),
      swig       = require('swig');

const ContainerAware  = require('./Compilers/ContainerAware'),
      SwigExtension   = require('./Compilers/SwigExtension'),
      SetSwigRenderer = require('./Compilers/SetSwigRenderer'),
      Route           = require('./Annotation/Route'),
      AssetManager    = require('./Asset/AssetManager'),
      HttpKernel      = require('./HttpKernel');

const YamlFileLoader                = require('./Loaders/YamlFileLoader'),
      AnnotationParser              = require('./Helpers/AnnotationParser'),
      MethodNotImplementedException = require('./Exceptions/MethodNotImplementedException'),
      LogicException                = require('./Exceptions/LogicException'),
      InvalidArgumentException      = require('./Exceptions/InvalidArgumentException');

class Kernel
{
    constructor (environment, debug)
    {
        this._environment       = environment;
        this._debug             = debug;
        this._container         = new DI.Container();
        this._bundles           = {};
        this._config            = {};
        this._annotation_parser = new AnnotationParser(this);

        this._initializeAnnotationParsers();

        this._initializeBundles();

        this._addDefinitions();

        this._initializeContainer();

    }

    _initializeBundles ()
    {
        this._bundles = {};
        for (let bundle of this.registerBundles()) {
            let bundleInstance = new bundle(this._container);
            let name           = bundleInstance.getName();
            if (this._bundles.hasOwnProperty(bundleInstance.getName())) {
                throw new LogicException(`Trying to register two bundles with the same name "${name}"`);
            }

            let dirname = path.dirname(search(require.cache, 'filename', `${bundle.name}.js`).filename);

            this._bundles[name] = {
                path:  dirname,
                class: bundleInstance
            };
        }
    }

    _initializeAnnotationParsers ()
    {
        this._annotation_parser.register('Route', Route);
    }

    _addDefinitions ()
    {
        let self = this;
        this._container.setDefinition('http_kernel', new DI.Definition(HttpKernel, [this]));
        this._container.setDefinition('asset_manager', new DI.Definition(AssetManager, [this]));

        this._container.setDefinition('swig', new DI.Definition(
            function (swig) {
                if (self._debug) {
                    swig.setDefaults({cache: false});
                }
                return swig;
            }, [swig]
        ));

        this._container.setDefinition('container', new DI.Definition(
            function (container) {
                return container;
            }, [this._container]
        ));

        this._container.setDefinition('kernel', new DI.Definition(
            function (kernel) {
                return kernel;
            }, [this]
        ));
    }

    _initializeContainer ()
    {
        this.registerContainerConfiguration(this.getContainerLoader());

        this._container.addCompilerPass(ContainerAware);
        this._container.addCompilerPass(SwigExtension);
        this._container.addCompilerPass(SetSwigRenderer);

        this._setPathParameters();

        if (dot.pick('services.autoload', this._config)) {
            Object.keys(require.cache).forEach(file => {
                Object.keys(this._bundles).forEach((name) => {
                    if (require.cache[file].exports.name === name) {
                        let moduleFile = path.normalize(file);
                        let modulePath = path.dirname(file);

                        let files = glob.sync('**/*.js', {cwd: modulePath, absolute: true});
                        for (let found of files) {
                            if (path.normalize(found) === moduleFile) {
                                continue;
                            }

                            let c          = require(found);
                            let args       = parameters(c).map(a => `@${a}`);
                            let definition = new DI.Definition(c, args);

                            if (instanceOf(c, 'Controller')) {
                                definition.addTag('container_aware');
                                definition.addTag('render');
                            }

                            this._container.setDefinition(c.name, definition);
                        }
                    }
                });
            });
        }

        Object.keys(this._container.$.definitions).forEach(key => {
            let d = this._container.$.definitions[key];
            this._annotation_parser.parse(d.$.class_function);
        });

    }

    _setPathParameters ()
    {
        let appKernel = search(require.cache, 'filename', `${this.constructor.name}.js`).filename;

        let app_dir     = path.dirname(appKernel);
        let project_dir = path.dirname(app_dir);

        this._container.setParameter('root_dir', app_dir);
        this._container.setParameter('project_dir', project_dir);
    }

    listen (port, options)
    {
        options = options || {};

        if (typeof options['ssl'] !== 'undefined') {
            https.createServer(options, this._handle.bind(this)).listen(port);
            return;
        }

        http.createServer(this._handle.bind(this)).listen(port);

    }

    _handle (request, response)
    {
        this.getHttpKernel().handle(request, response);
    }

    getHttpKernel ()
    {
        return this._container.get('http_kernel');
    }

    getContainer ()
    {
        return this._container;
    }

    getContainerLoader ()
    {
        return new YamlFileLoader(this);
    }

    getConfig ()
    {
        return this._config;
    }

    registerBundles ()
    {
        throw new MethodNotImplementedException(this, 'registerBundles()');
    }

    getBundles ()
    {
        return this._bundles;
    }

    getBundle (name)
    {
        if (!this._bundles.hasOwnProperty(name)) {
            throw new InvalidArgumentException(`Bundle "${name}" does not exist or it is not enabled. Maybe you forgot to add it in the registerBundles() method of your ${this.constructor.name}.js file?'`);
        }
    }

    registerContainerConfiguration ()
    {
        throw new MethodNotImplementedException(this, 'registerContainerConfiguration(loader)');
    }
}

module.exports = Kernel;