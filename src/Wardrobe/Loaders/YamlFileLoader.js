const DI = require('apex-di');

class CustomYamlLoader extends DI.YamlLoader
{
    constructor (kernel)
    {
        super();
        this._kernel = kernel;
    }

    _parse (container, path_info, data)
    {
        if (!data) {
            return;
        }

        super._parse(container, path_info, data);

        if (typeof data.framework !== 'undefined') {
            this._kernel._config = data.framework;
            Object.freeze(this._kernel._config);
        }

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