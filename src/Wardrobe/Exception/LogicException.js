class LogicException extends Error
{
    constructor (message, id)
    {
        super(message, id);
    }
}

module.exports = LogicException;