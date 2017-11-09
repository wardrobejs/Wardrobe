global.path = require('path');
global.fs   = require('fs');

module.exports = {
    // Core
    Kernel:     require('./Wardrobe/Kernel'),
    Bundle:     require('./Wardrobe/Bundle'),
    Controller: require('./Wardrobe/Controller'),

    // Internal Bundles
    SwigBundle: require('./SwigBundle/SwigBundle'),

    // Abstractions and Interfaces
    Swig: {
        SwigExtension: require('./SwigBundle/Swig/SwigExtension')
    }

};