global.path = require('path');
global.fs   = require('fs');

module.exports = {
    // Core
    Kernel:     require('./Wardrobe/Kernel'),
    Bundle:     require('./Wardrobe/Bundle'),
    Controller: require('./Wardrobe/Controller'),

    // Internal Bundles
    SwigBundle:  require('./SwigBundle/SwigBundle'),
    AssetBundle: require('./AssetBundle/AssetBundle'),

    // Abstractions and Interfaces
    Swig: require('./SwigBundle/Swig/index'),
    DI:   require('apex-di')

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
