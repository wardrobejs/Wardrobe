module.exports = (options) => {
    let o = {...options};

    o[Symbol.iterator] = function () {

        let properties = Object.keys(this);

        let count = -1;
        let next  = () => {
            count++;

            if (count >= properties.length) {
                return {done: true};
            }

            return {
                done:  false,
                value: [properties[count], this[properties[count]]]
            };
        };

        // return the next method used to iterate
        return {next};
    };

    return o;
};