// Wardrobe-Require (wrquire)
// Overrides default logic of module's require by checking parents and firing an event on successful load

const Module       = require('module');
const EventEmitter = require('events').EventEmitter;

const originalRequire = Module.prototype.require;

let em = new EventEmitter();

Module.prototype.require = function (id, parent = undefined) {
    if (!parent) {
        parent = this;
    }

    let response;
    try {
        em.emit('load', this);
        return originalRequire.apply(parent, [id]);
    } catch (ex) {
        if (parent.parent) {
            return this.require(id, parent.parent);
        }
        response = ex;
    }

    throw response;
};

module.exports = em;
