module.exports = (data) => {

    if(typeof data === 'string') {
        return data;
    }

    if(data.constructor.name === 'Array') {
        if(data.length > 0) {
            return module.exports(data[0]);
        }
    }

    throw new Error(`Unable to extract object of type ${typeof data}`);
};