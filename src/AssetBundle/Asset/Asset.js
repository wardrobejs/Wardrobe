/* APEX; Asset Manager                             _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/

class Asset
{
    constructor (data)
    {
        this.bundle    = data.bundle;
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

    getBase64 ()
    {
        return `data:${this.type};base64,${this.getBuffer().toString('base64')}`;
    }

    getPublic ()
    {
        return this.asset_url.replace('://', '/').replace('@', '/').toLowerCase();
    }
}

module.exports = Asset;