const wrequire = require('./Helper/wrequire'),
      DI       = require('apex-di'),
      search   = require('./Helper/search'),
      extract  = require('./Helper/extract'),
      http     = require('http'),
      https    = require('https');

const AnnotationParser = require('./AnnotationParser'),
      YamlFileLoader   = require('./Loader/YamlFileLoader');

class Kernel
{
    get VERSION ()
    {
        return require('../../package.json').version;
    }

    constructor (environment, debug)
    {
        let appKernel = search(require.cache, 'filename', `${this.constructor.name}.js`).filename;

        this._app_dir     = path.dirname(appKernel);
        this._project_dir = path.dirname(this._app_dir);

        this._environment = environment;
        this._debug       = debug;

        this._container   = new DI.Container();
        this._yaml_loader = new YamlFileLoader(this);

        this._bundles = {};
        this._config  = {};

        this._interceptRequire();
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
            parseAnnotations(m);
        });
    }

    _initializeBundles ()
    {
        this._bundles = {};
        for (let bundle of this.registerBundles()) {
            let bundleInstance = new bundle(this._container);
            let name           = bundleInstance.getName();
            if (this._bundles.hasOwnProperty(bundleInstance.getName())) {
                throw new Error(`Trying to register two bundles with the same name "${name}"`);
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
        this._container.setParameter('root_dir', this._app_dir);
        this._container.setParameter('project_dir', this._project_dir);
    }

    listen (port, options)
    {
        options = options || {};

        let started = (err) => {
            if (err) {
                logger.error(err);
            }
            let logger = this.getContainer().get('logger');
            logger.log(`Server listening on ${port}`);
        };

        if (typeof options['ssl'] !== 'undefined') {
            https.createServer(options['ssl'], this._handle.bind(this)).listen(port, started);
            return;
        }

        http.createServer(this.getHttpKernel().handle.bind(this.getHttpKernel())).listen(port, started);
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
        throw new Error(`registerBundles() not implemented in ${this.constructor.name}`);
    }

    getBundles ()
    {
        return this._bundles;
    }

    getBundle (name)
    {
        if (!this._bundles.hasOwnProperty(name)) {
            throw new Error(`Bundle "${name}" does not exist or it is not enabled. Maybe you forgot to add it in the registerBundles() method of your ${this.constructor.name}.js file?'`);
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
        throw new Error(`registerContainerConfiguration(loader) not implemented in ${this.constructor.name}`);
    }
}

module.exports = Kernel;