const DI = require('apex-di');

class ContainerAware extends DI.AbstractCompilerPass
{
    compile (container)
    {
        let service_ids = container.findTaggedServiceIds('container_aware');
        service_ids.forEach((id) => {
            container.getDefinition(id).addMethodCall('setContainer', [container]);
        });
    }
}

module.exports = ContainerAware;