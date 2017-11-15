/**
 Multipart Parser (Finite State Machine)

 usage:

 let multipart = require('./multipart.js');
 let body = multipart.DemoData();                               // raw body
 let body = new Buffer(event['body-json'].toString(),'base64'); // AWS case

 let boundary = multipart.getBoundary(event.params.header['content-type']);
 let parts = multipart.Parse(body,boundary);

 // each part is:
 // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }

 author:  Cristian Salazar (christiansalazarh@gmail.com) www.chileshift.cl
 Twitter: @AmazonAwsChile
 */
exports.Parse = function (multipartBodyBuffer, boundary) {
    let process   = function (part) {
        // will transform this object:
        // { header: 'Content-Disposition: form-data; name="uploads[]"; filename="A.txt"',
        //	 info: 'Content-Type: text/plain',
        //	 part: 'AAAABBBB' }
        // into this one:
        // { filename: 'A.txt', type: 'text/plain', data: <Buffer 41 41 41 41 42 42 42 42> }
        let obj    = function (str) {
            let k = str.split('=');
            let a = k[0].trim();
            let b = JSON.parse(k[1].trim());
            let o = {};
            Object.defineProperty(o, a,
                {value: b, writable: true, enumerable: true, configurable: true});
            return o;
        };
        let header = part.header.split(';');

        if (part.fieldInfo !== null && part.fieldInfo !== '') {
            let field = obj(header[1]);
            Object.defineProperty(field, 'data',
                {value: part.fieldInfo, writable: true, enumerable: true, configurable: true});
            return field;
        }

        let name = obj(header[1]);
        let file = obj(header[2]);
        let contentType = part.info.split(':')[1].trim();

        Object.defineProperty(file, 'name',
            {value: name.name, writable: true, enumerable: true, configurable: true});
        Object.defineProperty(file, 'type',
            {value: contentType, writable: true, enumerable: true, configurable: true});
        Object.defineProperty(file, 'data',
            {value: new Buffer(part.part), writable: true, enumerable: true, configurable: true});
        return file;
    };
    let prev      = null;
    let lastline  = '';
    let header    = '';
    let info      = '';
    let state     = 0;
    let buffer    = [];
    let allParts  = [];
    let fieldInfo = '';  // this will hold the field info when part is not a file.

    for (i = 0; i < multipartBodyBuffer.length; i++) {
        let oneByte         = multipartBodyBuffer[i];
        let prevByte        = i > 0 ? multipartBodyBuffer[i - 1] : null;
        let newLineDetected = ((oneByte === 0x0a) && (prevByte === 0x0d));
        let newLineChar     = ((oneByte === 0x0a) || (oneByte === 0x0d));

        if (!newLineChar) {
            lastline += String.fromCharCode(oneByte);
        }

        if ((0 === state) && newLineDetected) {
            if (('--' + boundary) === lastline) {
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
            if (lastline.length > (boundary.length + 4)) {
                lastline = '';
            } // mem save
            if (((('--' + boundary) === lastline))) {
                let j    = buffer.length - lastline.length;
                let part = buffer.slice(0, j - 1);
                let p    = {header: header, info: info, part: part, fieldInfo: fieldInfo};  // adding fieldInfo to the part to process
                allParts.push(process(p));
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
};

//  read the boundary from the content-type header sent by the http client
//  this value may be similar to:
//  'multipart/form-data; boundary=----WebKitFormBoundaryvm5A9tzU1ONaGP5B',
exports.getBoundary = function (header) {
    let items = header.split(';');
    if (items) {
        for (i = 0; i < items.length; i++) {
            let item = (String(items[i])).trim();
            if (item.indexOf('boundary') >= 0) {
                let k = item.split('=');
                return (String(k[1])).trim();
            }
        }
    }
    return '';
};
