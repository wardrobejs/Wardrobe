let COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
let DEFAULT_PARAMS = /=[^,]+/mg;
let FAT_ARROWS = /=>.*$/mg;

function getParameterNames(fn) {
    let code = fn.toString()
                 .replace(COMMENTS, '')
                 .replace(FAT_ARROWS, '')
                 .replace(DEFAULT_PARAMS, '');

    if(code.split("\n")[0].indexOf('extends') !== -1) {
        return getParameterNames(Object.getPrototypeOf(fn));
    }

    code = code.replace(/constructor\s+\(/, 'constructor(');
    let result = code.slice(code.indexOf('constructor') + 12, code.indexOf(')'))
                     .match(/([^\s,]+)/g);

    return result === null
        ? []
        : result;
}

module.exports = getParameterNames;
