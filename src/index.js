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