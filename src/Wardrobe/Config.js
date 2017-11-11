class Config
{
    constructor (kernel)
    {
        return new Proxy(this, {
            get: (target, property) => {
                return kernel._config[property];
            }
        });
    }

}

module.exports = Config;