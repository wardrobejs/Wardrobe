const DI = require('apex-di');

class SwigExtension extends DI.AbstractCompilerPass
{
    compile (container)
    {
        // let service_ids = container.findTaggedServiceIds('swig.extension');
        // let swig = container.get('swig'); // <- not possible
        // service_ids.forEach((id) => {
        //
        //     let filters = container.getDefinition(id).addMethodCall('extend', [swig]);
        //
        // });
    }
}

module.exports = SwigExtension;