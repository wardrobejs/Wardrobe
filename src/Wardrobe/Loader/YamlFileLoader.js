const DI        = require('apex-di');
const YAML      = require('js-yaml');
const deepMerge = require('../Helper/DeepMerge');

class CustomYamlLoader extends DI.YamlLoader
{
    constructor (kernel)
    {
        super();
        this._kernel = kernel;
    }

    /**
     * Loads the given YAML file into the container.
     *
     * @param container
     * @param file
     */
    load (container, file)
    {
        let path_info = path.parse(file);
        let directory = path.resolve(path_info.dir);

        // Add the directory of the given file to the module paths lookup list. This way, relative imports of node-
        // modules are possible from the location of the YAML file.
        module.paths.unshift(directory);

        // Load the YAML data as an object.
        let data = YAML.load(fs.readFileSync(file), {schema: this._schema});

        // Remove the module path from the list after we're done reading.
        if (module.paths.shift() !== directory) {
            throw new Error('Integrity of module lookup paths has been compromised while loading YAML "' + file + '".');
        }

        // Process the data.
        this._parse(container, path_info, data);
    }

    _parse (container, path_info, data)
    {
        if (!data) {
            return;
        }

        super._parse(container, path_info, data);

        this._kernel._config = deepMerge(this._kernel._config, data);
    }

    /**
     * @private
     * @returns {Array}
     */
    _createSchema ()
    {
        return [
            new YAML.Type('!require', {
                kind:      'scalar',
                construct: (data) => {
                    let matches = data.match(/@(.+):\/\/(.*)/);
                    if (matches) {
                        let name = matches[1];
                        let dir  = matches[2];
                        data     = path.join(this._kernel.getBundle(name).path, dir);
                    }

                    try {
                        return require(data);
                    } catch (e) {
                        let file = path.join(module.paths[0], data);
                        if (!fs.existsSync(file)) {
                            file += '.js';
                            if (!fs.existsSync(file)) {

                                throw new Error('Cannot find module "' + data + '".');
                            }
                        }
                        return require(file);
                    }
                }
            })
        ];
    }

}

class YamlFileLoader
{
    constructor (kernel)
    {
        this._container   = kernel.getContainer();
        this._yaml_loader = new CustomYamlLoader(kernel);
    }

    load (file_path)
    {
        this._yaml_loader.load(this._container, file_path);
    }
}

module.exports = YamlFileLoader;