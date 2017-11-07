var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var DEFAULT_PARAMS = /=[^,]+/mg;
var FAT_ARROWS = /=>.*$/mg;

function getParameterNames(fn) {
    var code = fn.toString()
                 .replace(COMMENTS, '')
                 .replace(FAT_ARROWS, '')
                 .replace(DEFAULT_PARAMS, '');

    if(code.split("\n")[0].indexOf('extends') !== -1) {
        return getParameterNames(Object.getPrototypeOf(fn));
    }

    code = code.replace(/constructor\s+\(/, 'constructor(');
    var result = code.slice(code.indexOf('constructor') + 12, code.indexOf(')'))
                     .match(/([^\s,]+)/g);

    return result === null
        ? []
        : result;
}

module.exports = getParameterNames;
