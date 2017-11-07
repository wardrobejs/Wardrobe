const DI = require('apex-di');

class Render extends DI.AbstractCompilerPass
{
    compile (container)
    {
        let service_ids = container.findTaggedServiceIds('container_aware');
        service_ids.forEach((id) => {
            container.getDefinition(id).replaceArgument(0, '@swig');
        });
    }
}

module.exports = ContainerAware;