const swig = require('swig');
const Renderer = require('./Renderer');

class SwigRenderer extends Renderer
{
    render (asset, parameters)
    {
        let render = swig.compileFile(asset.file);

        return render(parameters);
    }

    accepts (asset) {
        switch(asset.ext) {
            case '.swig':
            case '.twig':
                return true;
            default:
                return false;
        }
    }


}

module.exports = SwigRenderer;