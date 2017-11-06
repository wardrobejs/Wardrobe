class MethodNotImplementedException extends Error
{
    constructor (instance, method)
    {
        super(`${instance.constructor.name} does not implement ${method}`);
    }
}

module.exports = MethodNotImplementedException;