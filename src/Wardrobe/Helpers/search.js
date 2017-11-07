const dot = require('dot-object');

module.exports = (obj, key, value) => {
    let foundKey = Object.keys(obj).filter(o => {
        return dot.pick(key, obj[o]).indexOf(value) !== -1
    })[0];

    return obj[foundKey];
};