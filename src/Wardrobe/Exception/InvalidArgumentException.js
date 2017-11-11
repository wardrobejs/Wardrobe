class InvalidArgumentException extends Error
{
    constructor (got, expected = undefined)
    {
        if(typeof expected === 'undefined') {
            return super(got);
        }
        super(`Invalid argument supplied, expected ${expected} but got ${got}`);
    }
}

module.exports = InvalidArgumentException;