global.path = require('path');
global.fs   = require('fs-extra');

process.on('unhandledRejection', (reason) => {
    console.error(reason);
});

module.exports = {
    // Core
    DI:               require('apex-di'),
    Kernel:           require('./Wardrobe/Kernel'),
    Bundle:           require('./Wardrobe/Bundle'),
    Controller:       require('./Wardrobe/Controller'),
    AnnotationParser: require('./Wardrobe/AnnotationParser'),
    Response:         require('./HttpFoundation/Response'),
    RedirectResponse: require('./HttpFoundation/RedirectResponse'),
    Cookie:           require('./HttpFoundation/Cookie'),
};

global.HttpError = class extends Error
{
    constructor (message, code)
    {
        super(message, code);
        this.code = code;
    }
};

global.array = function (value) {
    if (value instanceof Array) {
        return value;
    }

    return [value];
};

Array.prototype.first = function () {
    if (typeof this[0] !== 'undefined') {
        return this[0];
    }

    return null;
};

Array.prototype.last = function () {
    if (typeof this[this.length - 1] !== 'undefined') {
        return this[this.length - 1];
    }
    return null;
};

String.prototype.ucfirst = function () {
    return this.charAt(0).toUpperCase() + this.substr(1);
};

String.prototype.lcfirst = function () {
    return this.charAt(0).toLowerCase() + this.substr(1);
};

String.prototype.trim = function (characters) {
    let c, i, j;
    characters = (characters || '').split('').map(c => c.charCodeAt(0));
    for (i = 0; i < this.length; i++) {
        c = this.charCodeAt(i);
        if (characters.indexOf(c) !== -1) {
            continue;
        }
        if (!(c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 11 || c === 160 || c === 5760 ||
                c === 6158 || c === 8192 || c === 8193 || c === 8194 || c === 8195 || c === 8196 || c === 8197 ||
                c === 8198 || c === 8199 || c === 8200 || c === 8201 || c === 8202 || c === 8232 || c === 8233 ||
                c === 8239 || c === 8287 || c === 12288 || c === 65279)) {
            break;
        }
    }

    for (j = this.length - 1; j >= i; j--) {
        c = this.charCodeAt(j);
        if (characters.indexOf(c) !== -1) {
            continue;
        }
        if (!(c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 11 || c === 160 || c === 5760 ||
                c === 6158 || c === 8192 || c === 8193 || c === 8194 || c === 8195 || c === 8196 || c === 8197 ||
                c === 8198 || c === 8199 || c === 8200 || c === 8201 || c === 8202 || c === 8232 || c === 8233 ||
                c === 8239 || c === 8287 || c === 12288 || c === 65279)) {
            break;
        }
    }
    return this.substring(i, j + 1);
};