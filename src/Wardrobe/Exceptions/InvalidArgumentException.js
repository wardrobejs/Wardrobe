class InvalidArgumentException extends Error
{
    constructor (message, id)
    {
        super(message, id);
    }
}

module.exports = InvalidArgumentException;