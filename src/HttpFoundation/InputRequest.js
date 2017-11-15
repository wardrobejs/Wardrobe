class InputRequest
{
    constructor (request)
    {
        this._request      = request;
        this._body         = request.body;
        this._content_type = request.headers['content-type'];
        this._boundary     = this._body.toString().split('\r\n')[0].trim('-');

        this._parts = this._parse();
    }

    getQuery ()
    {
        let query  = this._request.url.split('?');
        let result = {};

        if (query.length >= 2) {
            query[1].split('&').forEach((item) => {
                try {
                    result[item.split('=')[0]] = item.split('=')[1];
                } catch (e) {
                    result[item.split('=')[0]] = '';
                }
            });
        }
        return result;
    }

    getFields ()
    {
        let fields = {};

        for (let part of this._parts) {
            if (typeof part.filename === 'undefined') {
                fields[part.name] = part.data;
            }
        }

        return fields;
    }

    getFiles ()
    {
        let files = {};

        for (let part of this._parts) {
            if (typeof part.filename !== 'undefined') {
                if (typeof files[part.name] === 'undefined') {
                    files[part.name] = [];
                }
                files[part.name].push({
                    name:           part.filename,
                    size:           part.data.length,
                    content:        part.data,
                    'content-type': part.contentType
                });
            }
        }

        return files;
    }

    _parse ()
    {
        if(!this._content_type) {
            return [];
        }

        switch (this._content_type.split(';')[0].trim()) {
            case 'application/json':
                return this._parse_json();
            case 'multipart/form-data':
                return this._parse_multipart();
                break;
            default:
                return this._parse_url_encoded();
        }
    }

    _parse_url_encoded ()
    {
        return this._body.toString().split('&').map(kvp => {
            let k = kvp.split('=');
            let a = k[0].trim();
            let b = k[1].trim();
            return {
                name: a,
                data: b
            }
        });
    }

    _parse_json ()
    {
        let parts = [];
        let json;
        try {
            json = JSON.parse(this._body.toString());
        } catch(e) {
            throw new Error(`Body is not valid JSON`);
        }

        Object.keys(json).forEach(key => {
            parts.push({
                name: key,
                data: json[key]
            })
        });

        return parts;
    }

    _parse_multipart ()
    {
        let lastline  = '';
        let header    = '';
        let info      = '';
        let state     = 0;
        let buffer    = [];
        let allParts  = [];
        let fieldInfo = '';  // this will hold the field info when part is not a file.

        for (let i = 0; i < this._body.length; i++) {
            let oneByte         = this._body[i];
            let prevByte        = i > 0 ? this._body[i - 1] : null;
            let newLineDetected = ((oneByte === 0x0a) && (prevByte === 0x0d));
            let newLineChar     = ((oneByte === 0x0a) || (oneByte === 0x0d));

            if (!newLineChar) {
                lastline += String.fromCharCode(oneByte);
            }

            if ((0 === state) && newLineDetected) {
                if (('--' + this._boundary) === lastline) {
                    state = 1;
                }
                lastline = '';
            } else if ((1 === state) && newLineDetected) {
                header   = lastline;
                state    = 2;
                lastline = '';
            } else if ((2 === state) && newLineDetected) {
                info     = lastline;
                state    = 3;
                lastline = '';
            } else if ((3 === state) && newLineDetected) {
                fieldInfo = lastline; // fieldInfo is exposed in lastline on this step.
                state     = 4;
                buffer    = [];
                lastline  = '';
            } else if (4 === state) {
                if (lastline.length > (this._boundary.length + 4)) {
                    lastline = '';
                } // mem save
                if (((('--' + this._boundary) === lastline))) {
                    let j    = buffer.length - lastline.length;
                    let part = buffer.slice(0, j - 1);
                    let p    = {header: header, info: info, part: part, fieldInfo: fieldInfo};  // adding fieldInfo to the part to process
                    allParts.push(this._process(p));
                    buffer   = [];
                    lastline = '';
                    state    = 5;
                    header   = '';
                    info     = '';
                } else {
                    buffer.push(oneByte);
                }
                if (newLineDetected) {
                    lastline = '';
                }
            } else if (5 === state) {
                if (newLineDetected) {
                    state = 1;
                }
            }
        }
        return allParts;
    }

    _process (part)
    {
        let header = part.header.split(';');

        if (part.fieldInfo !== null && part.fieldInfo !== '') {
            let field = this._toObj(header[1]);

            Object.defineProperty(field, 'data', {
                value:        part.fieldInfo,
                writable:     true,
                enumerable:   true,
                configurable: true
            });

            return field;
        }

        let name        = this._toObj(header[1]);
        let file        = this._toObj(header[2]);
        let contentType = part.info.split(':')[1].trim();

        Object.defineProperty(file, 'name', {
            value:        name.name,
            writable:     true,
            enumerable:   true,
            configurable: true
        });

        Object.defineProperty(file, 'type', {
            value:        contentType,
            writable:     true,
            enumerable:   true,
            configurable: true
        });

        Object.defineProperty(file, 'data', {
            value:        new Buffer(part.part),
            writable:     true,
            enumerable:   true,
            configurable: true
        });

        return file;
    }


    _toObj (str)
    {
        if(!str) return;
        let k = str.split('=');
        let b, a = k[0].trim();
        try {
            b = JSON.parse(k[1].trim());
        } catch (e) {
            b = k[1].trim();
        }
        let o = {};
        Object.defineProperty(o, a,
            {value: b, writable: true, enumerable: true, configurable: true});
        return o;
    }

}

module.exports = InputRequest;