const Asset = require('./Asset');

class AssetManager
{
    constructor (kernel)
    {
        this._kernel  = kernel;
        this.packages = {};
        this.virtual  = {};

        this.refresh();
    }

    /**
     * Refreshes the indexed bundle resources.
     */
    refresh ()
    {
        this.packages = {};

        Object.keys(this.virtual).forEach((key) => {
            this.packages[key] = this.virtual[key];
        });

        const iterate = (bundle_name, bundle_path) => {
            if (fs.statSync(bundle_path).isDirectory() && fs.existsSync(path.join(bundle_path, 'Resources'))) {
                this._refreshPackageResources(bundle_name, path.join(bundle_path, 'Resources'));
            }
        };

        let bundles = this._kernel.getBundles();
        Object.keys(bundles).forEach((name) => {
            iterate(name, bundles[name].path);
        });
    }

    /**
     * Returns the absolute file info object of the given name or {undefined} if the asset cannot be resolved.
     *
     * If {force_file} is set to true, the returned asset MUST be a file object. If this boolean is set to false, a
     * directory may be returned as well.
     *
     * If {throw_error} is set to true, resolve() will throw an error instead of returning {undefined}.
     *
     * @param  {String}  name
     * @param  {Boolean} force_file
     * @param  {Boolean} throw_error
     * @return {Object|undefined}
     */
    resolve (name, force_file, throw_error)
    {
        if (name.charAt(0) !== '@') {
            if (!fs.existsSync(name)) {
                if (throw_error) {
                    throw new Error('File "' + name + '" does not exist.');
                }
                return;
            }
            let info       = path.parse(name);
            info.asset_url = undefined; // @FIXME : Resolve file into asset url.
            info.type      = require('mime-types').lookup(name);
            info.file      = path.resolve(path.join(info.dir, info.base));

            return new Asset(info);
        }

        let regexp = new RegExp(/^\@(\w+)\:\/\/(.+)$/).exec(name);
        if (regexp === null || (regexp !== null && regexp.length !== 3)) {
            return;
        }

        let package_name = regexp[1],
            asset_path   = regexp[2].split('/');

        if (typeof this.packages[package_name] === 'undefined') {
            if (throw_error) {
                throw new Error('Unable to resolve "' + name + '". Package "' + package_name + '" does not exist.');
            }
            return;
        }

        let scope        = this.packages[package_name],
            paths        = [];

        let _lookupAsset = () => {
            let dir = asset_path.shift();
            if (!dir) {
                if (force_file && typeof scope.dir !== 'string' && scope.base !== 'string') {
                    return;
                }
                return scope;
            }
            if (typeof scope[dir] === 'undefined') {
                if (throw_error) {
                    throw new Error('Unable to resolve "' + name + '". "' + dir + '" does not exist in "' + package_name + "://" + paths.join('/') + '"');
                }
                return;
            }
            paths.push(dir);
            scope = scope[dir];
            return _lookupAsset();
        };

        return _lookupAsset();
    }

    /**
     * @private
     * @param {String} name
     * @param {String} directory
     */
    _refreshPackageResources (name, directory)
    {
        let info, stat, package_info = path.parse(directory);

        this.packages[name] = {};
        if (typeof this.virtual[name] === 'object') {
            Object.keys(this.virtual[name]).forEach((key) => {
                this.packages[name][key] = this.virtual[name][key];
            });
        }

        let iterate = (dir, target, package_name) => {
            fs.readdirSync(dir).forEach((file) => {
                file = path.join(dir, file);
                info = path.parse(file);
                stat = fs.statSync(file);

                if (stat.isDirectory()) {
                    target[info.base] = {};
                    iterate(file, target[info.base], package_name);
                    return;
                }

                info.asset_url    = '@' + package_name + ':/' + info.dir.replace(/\\/g, '/').split('/Resources')[1] + '/' + info.base;
                info.type         = require('mime-types').lookup(file);
                info.file         = path.resolve(path.join(info.dir, info.base));
                target[info.base] = new Asset(info);
            });
        };
        iterate(directory, this.packages[name], name);
    }
}

module.exports = AssetManager;