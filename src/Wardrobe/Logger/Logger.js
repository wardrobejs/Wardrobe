const JS_EOL = require('os').EOL;

class Logger
{
    constructor (container)
    {
        this._container  = container;
        this._queue      = [];
        this._namespaces = [
            'output',
            'error',
            'access'
        ];

        // ensure log directory exists
        let log_dir = path.join(container.getParameter('project_dir'), 'var', 'log');
        fs.ensureDir(log_dir);

        let queueWorder = () => {
            setTimeout(() => {
                while (this._queue.length) {
                    let message = this._queue.shift();
                    console.log(`[${message.namespace.toUpperCase()}]: ${message.message}`);
                    fs.appendFileSync(path.join(log_dir, `${message.namespace}.log`), `${message.message}${JS_EOL}`);
                }
                queueWorder();
            }, 100);
        };
        queueWorder();
    }

    addNamespace (namespace)
    {
        if (this._namespaces.indexOf(namespace) !== -1) {
            throw new Error(`Logger for "${namespace} already exists"`);
        }
    }

    write (namespace, message)
    {
        if (this._namespaces.indexOf(namespace) === -1) {
            throw new Error(`Logger for "${namespace}" does not exist.`);
        }

        this._queue.push({namespace: namespace, message: message});
    }

    error (message)
    {
        this.write('error', message);
    }

    access (message)
    {
        this.write('access', message);
    }

    log (message)
    {
        this.write('output', message);
    }
}

module.exports = Logger;