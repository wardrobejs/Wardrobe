const MethodNotImplementedException = require('../../Wardrobe/Exception/MethodNotImplementedException');

class TokenParser
{
    constructor ()
    {
        this.ends       = false;
        this.blockLevel = false;
    }

    getTag ()
    {
        throw new MethodNotImplementedException(this, 'getTag(): string');
    }

    parse ()
    {
        throw new MethodNotImplementedException(this, 'parse(str, line, parser, types, options)');
    }

    compile ()
    {
        throw new MethodNotImplementedException(this, 'compile(compiler, args, content, parents, options, blockName)');
    }

}

module.exports = TokenParser;