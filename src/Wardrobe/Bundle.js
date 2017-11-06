class Bundle
{
    constructor (container)
    {
        this._container = container;
    }

    getName ()
    {
        return this.constructor.name;
    }
}

module.exports = Bundle;