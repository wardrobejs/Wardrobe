const DI = require('apex-di');

class SetSwigRenderer extends DI.AbstractCompilerPass
{
    compile (container)
    {
        let service_ids = container.findTaggedServiceIds('swig');
        service_ids.forEach((id) => {
            container.getDefinition(id).addMethodCall('setRenderer', ['@swig']);
        });
    }
}

module.exports = SetSwigRenderer;