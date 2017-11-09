class Asset
{
    constructor (data)
    {
        this.name      = data.name;
        this.base      = data.base;
        this.type      = data.type;
        this.file      = data.file;
        this.ext       = data.ext;
        this.dir       = data.dir;
        this.asset_url = data.asset_url;
    }

    /**
     * @returns {String}
     */
    getString ()
    {
        return fs.readFileSync(this.file).toString();
    }

    /**
     * @returns {Buffer}
     */
    getBuffer ()
    {
        return new Buffer(fs.readFileSync(this.file));
    }

    getBase64 () {
        return `data:${this.type};base64,${this.getBuffer().toString('base64')}`;
    }
}

module.exports = Asset;