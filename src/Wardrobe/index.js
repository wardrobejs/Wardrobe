global.path = require('path');
global.fs   = require('fs');

module.exports = {
    Kernel:     require('./Kernel'),
    Bundle:     require('./Bundle'),
    Controller: require('./Controller'),

    Swig: require('./Swig'),

};