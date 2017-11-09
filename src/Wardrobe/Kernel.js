const DI         = require('apex-di'),
      search     = require('./Helper/search'),
      http       = require('http'),
      https      = require('https');

const ContainerAware   = require('./Compiler/ContainerAware'),
      Route            = require('./Annotation/Route'),
      AssetManager     = require('./Asset/AssetManager'),
      HttpKernel       = require('./HttpKernel'),
      AnnotationParser = require('./AnnotationParser');

const YamlFileLoader                = require('./Loader/YamlFileLoader'),
      MethodNotImplementedException = require('./Exception/MethodNotImplementedException'),
      LogicException                = require('./Exception/LogicException'),
      InvalidArgumentException      = require('./Exception/InvalidArgumentException');

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
        this._yaml_loader       = new YamlFileLoader(this);


        this._initializeBundles();

        this._initializeAnnotationParsers();

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

        Object.keys(this._bundles).forEach((name) => {
            let bundle = this._bundles[name];
            if (!fs.existsSync(path.join(bundle.path, 'Annotation'))) {
                return;
            }
            fs.readdirSync(path.join(bundle.path, 'Annotation')).forEach((file) => {
                file  = path.join(bundle.path, 'Annotation', file);
                let c = require(file);
                this._annotation_parser.register(c.name, c);
            });
        });

    }

    _addDefinitions ()
    {
        this._container.setDefinition('http_kernel', new DI.Definition(HttpKernel, [this]));
        this._container.setDefinition('asset_manager', new DI.Definition(AssetManager, [this]));

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

        // Load all bundles
        Object.keys(this._bundles).forEach((name) => {
            let bundle = this._bundles[name];
            let config = path.join(bundle.path, 'Resources', 'config', 'config.yml');
            if (fs.existsSync(config)) {
                this._yaml_loader.load(config);
            }
        });

        this._setPathParameters();

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
            https.createServer(options['ssl'], this._handle.bind(this)).listen(port);
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
        return new YamlFileLoader(this); //this._yaml_loader;
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

        return this._bundles[name];
    }

    registerContainerConfiguration ()
    {
        throw new MethodNotImplementedException(this, 'registerContainerConfiguration(loader)');
    }
}

module.exports = Kernel;