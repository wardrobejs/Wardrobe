const wrequire = require('./Helper/wrequire'),
      DI       = require('apex-di'),
      search   = require('./Helper/search'),
      extract  = require('./Helper/extract'),
      http     = require('http'),
      https    = require('https');

const AnnotationParser              = require('./AnnotationParser'),
      YamlFileLoader                = require('./Loader/YamlFileLoader'),
      MethodNotImplementedException = require('./Exception/MethodNotImplementedException'),
      LogicException                = require('./Exception/LogicException'),
      InvalidArgumentException      = require('./Exception/InvalidArgumentException');

class Kernel
{
    get VERSION ()
    {
        return require('../../package.json').version;
    }

    constructor (environment, debug)
    {
        this._interceptRequire();

        this._environment = environment;
        this._debug       = debug;

        this._container   = new DI.Container();
        this._yaml_loader = new YamlFileLoader(this);

        this._bundles = {};
        this._config  = {};

        this._initializeBundles();
        this._initializeContainer();
        this._addDefinitions();
        this._setPathParameters();

        // Load user config (overriding existing)
        this.registerContainerConfiguration(this.getContainerLoader());
    }

    _interceptRequire ()
    {
        const _annotation_parser = new AnnotationParser(this);
        const annotated          = {};

        const parseAnnotations = (_module) => {
            setTimeout(() => { // do this async
                if (!_module.annotated) {
                    _annotation_parser.parse(_module);
                    _module.annotated = true;
                    _module.children.forEach(child => parseAnnotations(child));
                }
            }, 0);
        };

        wrequire.on('load', (m) => {
            if (typeof annotated[m.id] === 'undefined') {
                parseAnnotations(m);
                annotated[m.id] = true;
            }
        });

        // listen on require event

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

    _addDefinitions ()
    {
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
        // Load configuration files
        this.getContainerLoader().load(path.join(__dirname, 'Resources', 'config', 'config.yml'));

        // Load all bundles
        Object.keys(this._bundles).forEach((name) => {
            let bundle = this._bundles[name];
            let config = path.join(bundle.path, 'Resources', 'config', 'config.yml');
            if (fs.existsSync(config)) {
                this._yaml_loader.load(config);
            }
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

        http.createServer(this.getHttpKernel().handle.bind(this.getHttpKernel())).listen(port);
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
        return this._yaml_loader;
    }

    getConfig ()
    {
        return this._config;
    }

    getEnvironment ()
    {
        return this._environment;
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

    findBundleByService (service)
    {
        let c       = this.getContainer().get(service);
        let bundles = Object.values(require.cache).filter(m => m.exports.toString() === c.constructor.toString());
        let bundle  = extract(bundles.map(b => b.filename.split(path.sep).reverse().filter(p => p.indexOf('Bundle') !== -1)));

        return this.getBundle(bundle);
    }

    registerContainerConfiguration ()
    {
        throw new MethodNotImplementedException(this, 'registerContainerConfiguration(loader)');
    }
}

module.exports = Kernel;