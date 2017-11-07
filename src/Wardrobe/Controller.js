class Controller
{
    constructor ()
    {
        this._container = null;
    }

    setContainer (container)
    {
        this._container = container;
    }

    getContainer ()
    {
        return this._container;
    }
}

module.exports = Controller;