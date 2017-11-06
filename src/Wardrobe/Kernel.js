const glob       = require('globby'),
      dot        = require('dot-object'),
      parameters = require('./Helpers/parameters'),
      instanceOf = require('./Helpers/instanceof');

const ContainerAware = require('./Compilers/ContainerAware');

const DI                            = require('apex-di'),
      YamlFileLoader                = require('./Loaders/YamlFileLoader'),
      MethodNotImplementedException = require('./Exceptions/MethodNotImplementedException'),
      LogicException                = require('./Exceptions/LogicException');

class Kernel
{
    constructor (environment, debug)
    {
        this._environment = environment;
        this._debug       = debug;
        this._container   = new DI.Container();
        this._bundles     = {};
        this._config      = {};

        this._initializeBundles();

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
            this._bundles[name] = bundleInstance;
        }
    }

    _initializeContainer ()
    {
        this.registerContainerConfiguration(this.getContainerLoader());
        this._container.addCompilerPass(ContainerAware);
        this._container.setParameter('kernel', this);

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
                            }

                            this._container.setDefinition(c.name, definition);

                        }
                    }
                });
            });
        }
    }

    _setPathParameters ()
    {
        let appKernel = Object.keys(require.cache).filter(o => require.cache[o].filename.indexOf('AppKernel.js') !== -1)[0];

        let app_dir = path.dirname(appKernel);
        let project_dir = path.dirname(app_dir);

        this._container.setParameter('root_dir', app_dir);
        this._container.setParameter('project_dir', project_dir);
    }


    _buildContainer ()
    {

    }

    getContainer ()
    {
        return this._container;
    }

    getContainerLoader ()
    {
        return new YamlFileLoader(this);
    }

    registerBundles ()
    {
        throw new MethodNotImplementedException(this, 'registerBundles()');
    }

    registerContainerConfiguration ()
    {
        throw new MethodNotImplementedException(this, 'registerContainerConfiguration(container, loader)');
    }
}

module.exports = Kernel;