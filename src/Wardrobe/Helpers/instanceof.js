module.exports = (fn, type) => {
    if (fn === null) {
        return false;
    }

    if (fn.name === type) {
        return true;
    }

    return module.exports(Object.getPrototypeOf(fn), type);
};